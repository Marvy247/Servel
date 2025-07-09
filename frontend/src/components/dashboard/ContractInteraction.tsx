'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Contract, JsonFragment } from 'ethers'
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ChevronDown,
  HelpCircle,
  X
} from 'lucide-react'
import { useWeb3 } from '../../providers/web3'
import { parseRevertReason } from '../../utils/errorParser'
import { validateInput, formatValue } from '../../utils/inputValidator'
import { StatusBadge } from './StatusBadge'
import Notification from './Notification'
import { Tooltip } from '../ui/Tooltip'
import { Button } from '../ui/button'

export default function ContractInteraction() {
  const { provider } = useWeb3()
  const [contractAddress, setContractAddress] = useState('')
  const [abi, setAbi] = useState<JsonFragment[]>([])
  const [selectedFunction, setSelectedFunction] = useState<{
    name: string
    type: 'function'
    inputs?: Array<{name: string; type: string}>
    stateMutability?: string
  } | null>(null)
  const [functionArgs, setFunctionArgs] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [gasUsed, setGasUsed] = useState<number | null>(null)
  const [estimatedGas, setEstimatedGas] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [confirmations, setConfirmations] = useState<number>(0)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [contracts, setContracts] = useState<Array<{
    address: string
    name: string
    abi: JsonFragment[] | string
  }>>([])
  const [showTooltip, setShowTooltip] = useState(true)
  const [notification, setNotification] = useState<{
    message: string
    type: 'info' | 'success' | 'error'
  } | null>(null)
  const [isAbiExpanded, setIsAbiExpanded] = useState(false)

  const closeTooltip = () => {
    setShowTooltip(false)
    localStorage.setItem('contractInteractionTooltipDismissed', 'true')
  }

  useEffect(() => {
    const dismissed = localStorage.getItem('contractInteractionTooltipDismissed')
    if (dismissed === 'true') setShowTooltip(false)
  }, [])

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    const loadVerifiedContracts = async () => {
      try {
        const response = await fetch('/api/verified-contracts')
        if (response.ok) {
          const data = await response.json()
          setContracts(data)
          localStorage.setItem('savedContracts', JSON.stringify(data))
        } else {
          const savedContracts = JSON.parse(localStorage.getItem('savedContracts') || '[]')
          setContracts(savedContracts)
        }
      } catch (error) {
        console.error('Failed to load verified contracts:', error)
        const savedContracts = JSON.parse(localStorage.getItem('savedContracts') || '[]')
        setContracts(savedContracts)
      }
    }

    loadVerifiedContracts()
  }, [])

  const handleContractSelect = async (address: string) => {
    setContractAddress(address)
    const contract = contracts.find(c => c.address === address)
    if (contract) {
      try {
        const parsedAbi = typeof contract.abi === 'string' 
          ? JSON.parse(contract.abi) 
          : contract.abi
        if (!Array.isArray(parsedAbi)) throw new Error('ABI must be an array')
        setAbi(parsedAbi)
      } catch (error) {
        console.error('Invalid ABI format:', error)
        setErrorMessage('Invalid contract ABI format')
      }
    } else {
      try {
        const response = await fetch(`/api/contract-abi/${address}`)
        if (response.ok) {
          const abi = await response.json()
          setAbi(abi)
          setContracts(prev => prev.map(c => 
            c.address === address ? {...c, abi} : c
          ))
        }
      } catch (error) {
        console.error('Failed to fetch ABI:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider || !contractAddress || !selectedFunction) return
    if (!validateAndFormatInputs()) {
      setErrorMessage('Please fix input validation errors before submitting')
      return
    }

    setTxStatus('pending')
    setResult(null)
    setGasUsed(null)
    setEstimatedGas(null)
    setErrorMessage('')
    setConfirmations(0)
    setTxHash(null)

    try {
      const signer = await provider.getSigner()
      const contract = new Contract(contractAddress, abi, provider)
      const estimatedGas = await (contract.connect(signer) as any).estimateGas[selectedFunction.name](
        ...Object.values(functionArgs)
      )
      setEstimatedGas(Number(estimatedGas))
    } catch (error) {
      console.error('Gas estimation failed:', error)
    }

    try {
      const signer = await provider.getSigner()
      const contract = new Contract(contractAddress, abi, provider)
      
      if (selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure') {
        const result = await (contract as any)[selectedFunction.name](...Object.values(functionArgs))
        setResult(result)
        setTxStatus('success')
        showNotification('Read function executed successfully', 'success')
      } else {
        const tx = await (contract.connect(signer) as any)[selectedFunction.name](...Object.values(functionArgs))
        setTxHash(tx.hash)
        showNotification('Transaction submitted', 'info')
        
        tx.wait()
          .then((receipt: any) => {
            setGasUsed(Number(receipt.gasUsed))
            setTxStatus('success')
            setResult(receipt)
            showNotification('Transaction confirmed', 'success')
          })
          .catch((error: any) => {
            setTxStatus('error')
            const revertReason = parseRevertReason(error)
            setErrorMessage(revertReason || 'Transaction failed')
            showNotification(revertReason || 'Transaction failed', 'error')
          })
      }
    } catch (error) {
      setTxStatus('error')
      setErrorMessage(error instanceof Error ? error.message : String(error))
      showNotification(error instanceof Error ? error.message : String(error), 'error')
    }
  }

  const validateAndFormatInputs = (): boolean => {
    if (!selectedFunction?.inputs) return true

    const newErrors: Record<string, string> = {}
    const formattedArgs: Record<string, any> = {}
    let hasErrors = false

    selectedFunction.inputs.forEach((input, index) => {
      const inputName = input.name || `arg_${index}`
      const value = functionArgs[inputName] || ''
      const validation = validateInput(value, input.type || 'string')
      
      if (!validation.isValid) {
        newErrors[inputName] = validation.error || 'Invalid input'
        hasErrors = true
      } else {
        try {
          formattedArgs[inputName] = formatValue(value, input.type || 'string')
        } catch (error) {
          newErrors[inputName] = 'Invalid format'
          hasErrors = true
        }
      }
    })

    setValidationErrors(newErrors)
    if (!hasErrors) setFunctionArgs(formattedArgs)
    return !hasErrors
  }

  const generateInputFields = () => {
    if (!selectedFunction?.inputs) return null
    
    return selectedFunction.inputs.map((input, index) => {
      const inputName = input.name || `arg_${index}`
      return (
        <div key={index} className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              {input.name || `arg_${index}`}
            </label>
            <span className="text-xs text-gray-500">{input.type}</span>
          </div>
          <input
            type="text"
            value={functionArgs[inputName] || ''}
            onChange={(e) => {
              const newValue = e.target.value
              setFunctionArgs(prev => ({
                ...prev,
                [inputName]: newValue
              }))
              
              if (validationErrors[inputName]) {
                setValidationErrors(prev => ({
                  ...prev,
                  [inputName]: ''
                }))
              }
            }}
            onBlur={() => {
              const validation = validateInput(functionArgs[inputName] || '', input.type || 'string')
              if (!validation.isValid) {
                setValidationErrors(prev => ({
                  ...prev,
                  [inputName]: validation.error || 'Invalid input'
                }))
              }
            }}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors[inputName] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Enter ${input.type || 'string'}`}
          />
          {validationErrors[inputName] && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors[inputName]}
            </p>
          )}
        </div>
      )
    })
  }

  return (
    <div className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Contract Playground</h2>
          {showTooltip && (
            <Tooltip>
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle className="w-5 h-5" />
              </button>
            </Tooltip>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Contract Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract
              </label>
              <div className="relative">
                <select
                  value={contractAddress}
                  onChange={(e) => handleContractSelect(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  required
                >
                  <option value="">Select a contract</option>
                  {(Array.isArray(contracts) ? contracts : []).map((contract) => (
                    <option key={contract.address} value={contract.address}>
                      {contract.name} ({contract.address.slice(0, 6)}...{contract.address.slice(-4)})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* ABI Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contract ABI
                </label>
                <button
                  type="button"
                  onClick={() => setIsAbiExpanded(!isAbiExpanded)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {isAbiExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <textarea
                value={JSON.stringify(abi, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    if (!Array.isArray(parsed)) throw new Error('ABI must be an array')
                    setAbi(parsed)
                    setErrorMessage('')
                  } catch (err) {
                    setErrorMessage('Invalid JSON format - please fix')
                    setAbi(e.target.value as any)
                  }
                }}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                  isAbiExpanded ? 'h-64' : 'h-32'
                }`}
                placeholder="Paste contract ABI JSON here"
                required
              />
            </div>

            {/* Function Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Function
              </label>
              <div className="relative">
                <select
                  value={selectedFunction?.name || ''}
                  onChange={(e) => {
                    const abiArray = Array.isArray(abi) ? abi : JSON.parse(abi)
                    const func = abiArray.find((f: JsonFragment) => 
                      f.type === 'function' && 
                      !!f.name && 
                      f.name === e.target.value
                    )
                    setSelectedFunction(func || null)
                    setFunctionArgs({})
                  }}
                  className="w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  disabled={abi.length === 0}
                >
                  <option value="">Select a function</option>
                  {(Array.isArray(abi) ? abi : JSON.parse(abi))
                    .filter((item: JsonFragment) => item.type === 'function')
                    .map((func: JsonFragment, index: number) => (
                      <option key={index} value={func.name}>
                        {func.name} ({func.stateMutability})
                      </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Function Arguments */}
            {selectedFunction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Function Arguments
                </h4>
                <div className="space-y-4">
                  {generateInputFields()}
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              disabled={!provider || !contractAddress || !selectedFunction || txStatus === 'pending'}
            >
              {txStatus === 'pending' ? 'Processing Transaction' : 'Execute Function'}
              {txStatus !== 'pending' && <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </form>

        {/* Transaction Results */}
        <AnimatePresence>
          {(txStatus !== 'idle' || errorMessage || result) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-8 space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-800">Transaction Details</h3>
              
              {txStatus !== 'idle' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Status:</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={txStatus} />
                      {estimatedGas && (
                        <span className="text-sm text-gray-600">
                          Est: {estimatedGas.toLocaleString()} gas
                        </span>
                      )}
                      {gasUsed && (
                        <span className="text-sm text-gray-600">
                          Used: {gasUsed.toLocaleString()} gas
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {txHash && (
                    <div className="mt-2">
                      <a 
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View on Etherscan <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800">Transaction Error</h4>
                      <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Result</h4>
                  <pre className="text-sm bg-white p-3 rounded border border-gray-200 overflow-auto max-h-64">
                    {typeof result === 'object' 
                      ? JSON.stringify(result, null, 2) 
                      : result.toString()}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}