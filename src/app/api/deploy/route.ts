import { NextRequest, NextResponse } from 'next/server';
import { ContractFactory } from 'ethers';
import { createWallet } from '@/utils/blockchain/provider'; 
import { getContractABI, getContractBytecode } from '@/utils/blockchain/contractLoader'; 
import { validatePositionsArray } from '@/utils/validation';
import { handleApiError, createValidationError } from '@/utils/api/errors';
import type { PositionInput, DeploymentResponse } from '@/types/blockchain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions, ...electionMetadata } = body; 

    try {
      // Validate input 
      validatePositionsArray(positions);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    // prepare data for contract contstructor
    const positionNames: string[] = [];
    const candidatesForPosition: string[][] = [];
    for (const position of positions as PositionInput[]) {
      const candidateNames = position.candidates.map((c) => c.name);
      positionNames.push(position.name);
      candidatesForPosition.push(candidateNames);
    }

    const wallet = createWallet();  
    // Get the ABI and Bytecode (Contract's code and manual)
    const abi = getContractABI();
    const bytecode = getContractBytecode();

    // Create contract factory (The tool that knows how to build the contract)
    const contractFactory = new ContractFactory(
      abi, 
      bytecode, 
      wallet 
    );

    console.log('Deploying contract with positions:', positionNames);
    
    const contract = await contractFactory.deploy(positionNames, candidatesForPosition);

        
    const deployTx = contract.deploymentTransaction();
    if (!deployTx) {
      throw new Error("Deployment transaction failed to generate.");
    }
    const txHash = deployTx.hash; 

    // deploy the contract on the blockchain
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log('Contract deployed to:', contractAddress);

    const response: DeploymentResponse = {
      success: true,
      contractAddress,
      txHash, 
      message: 'Contract deployed successfully and transaction confirmed.'
    };

    // Use NextResponse.json for Next.js App Router return (FIXED)
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    // Return a 500 status code for server/deployment errors
    return handleApiError(error, 'deploy');
  }
}