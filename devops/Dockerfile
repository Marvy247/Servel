# Dockerfile for Anvil local blockchain node
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y curl ca-certificates

# Install Foundry (forge, anvil, cast)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"

# Expose Anvil default port
EXPOSE 8545

# Start Anvil node
CMD ["anvil", "--host", "0.0.0.0"]
