import { NextRequest } from 'next/server';
import { ContractFactory } from 'ethers';
import { createWallet } from '@/utils/blockchain/provider';
import { getContractABI, getContractBytecode } from '@/utils/blockchain/contractLoader';
import { validatePositionsArray } from '@/utils/validation';
import { handleApiError, createValidationError } from '@/utils/api/errors';
import { getEtherscanUrl } from '@/config/blockchain';
import type { PositionInput, DeploymentResponse } from '@/types/blockchain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions } = body;

    // Validate input
    try {
      validatePositionsArray(positions);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    // Extract position names and candidates for each position
    const positionNames: string[] = [];
    const candidatesForPosition: string[][] = [];

    for (const position of positions as PositionInput[]) {
      const candidateNames = position.candidates.map((c) => c.name);
      positionNames.push(position.name);
      candidatesForPosition.push(candidateNames);
    }

    // Create wallet and contract factory
    const wallet = createWallet();
    const contractFactory = new ContractFactory(
      getContractABI(),
      getContractBytecode(),
      wallet
    );

    // Deploy contract
    console.log('Deploying contract with positions:', positionNames);
    console.log('Candidates for each position:', candidatesForPosition);

    const contract = await contractFactory.deploy(positionNames, candidatesForPosition);
    
    // Wait for deployment
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();

    console.log('Contract deployed to:', contractAddress);

    // Generate Etherscan URL
    const etherscanUrl = getEtherscanUrl(contractAddress);

    const response: DeploymentResponse = {
      success: true,
      contractAddress,
      etherscanUrl,
      message: 'Contract deployed successfully'
    };

    return Response.json(response);

  } catch (error) {
    return handleApiError(error, 'deploy');
  }
}

