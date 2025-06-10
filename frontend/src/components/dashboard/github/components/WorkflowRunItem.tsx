import React from 'react';
import { WorkflowRun } from '../../../../types/github';
import { getStatusColor, formatDuration } from '../utils/statusHelpers';

interface WorkflowRunItemProps {
  run: WorkflowRun;
  onClick?: () => void;
}

const WorkflowRunItem: React.FC<WorkflowRunItemProps> = ({ run, onClick }) => {
  const statusColor = getStatusColor(run.conclusion || run.status);
  
  return (
    <div 
      className={`p-3 border-l-4 border-${statusColor}-500 bg-white rounded shadow mb-2 cursor-pointer hover:bg-gray-50`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">{run.name}</h4>
          <p className="text-sm text-gray-500">
            #{run.id} • {run.branch}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-${statusColor}-500 font-medium`}>
            {run.conclusion || run.status}
          </p>
          <p className="text-sm text-gray-500">
            {formatDuration(run.duration)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowRunItem;
