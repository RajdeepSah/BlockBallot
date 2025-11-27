import { NextRequest } from 'next/server';
import { ContractFactory } from 'ethers';
import { createWallet } from '@/utils/blockchain/provider'; 
import { getContractABI, getContractBytecode } from '@/utils/blockchain/contractLoader'; 
import { validatePositionsArray } from '@/utils/validation';
import { handleApiError, createValidationError, createUnauthorizedError } from '@/utils/api/errors';
import type { PositionInput, DeploymentResponse } from '@/types/blockchain';
import { createClient } from '@/utils/supabase/server';
import { authenticateUser } from '@/utils/api/auth';
import { Election } from '@/types/election';
// Generate random election code
function generateCode(length = 7): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const electionPayload = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return createUnauthorizedError();
    }

    const requestUser = await authenticateUser(authHeader);
    const supabase = await createClient();

    try {
      // Validate input 
      validatePositionsArray(electionPayload.positions);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    // prepare data for contract contstructor
    const positionNames: string[] = [];
    const candidatesForPosition: string[][] = [];
    for (const position of electionPayload.positions as PositionInput[]) {
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

    const contract = await contractFactory.deploy(positionNames, candidatesForPosition);

    const deployTx = contract.deploymentTransaction();
    if (!deployTx) {
      throw new Error("Deployment transaction failed to generate.");
    }
    const txHash = deployTx.hash; 

    // deploy the contract on the blockchain
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();

    // Generate unique election code
    let code = generateCode();
    let codeExists = true;
    while (codeExists) {
      const { data, error } = await supabase
        .from('elections')
        .select('code')
        .eq('code', code)
        .maybeSingle();
      // If error or data exists, code is taken; otherwise it's available
      codeExists = !error && !!data;
      if (codeExists) {
        code = generateCode();
      }
    }

    // Determine election status based on current time and election dates
    const now = new Date();
    const startsAt = new Date(electionPayload.starts_at);
    const endsAt = new Date(electionPayload.ends_at);
    
    let status: 'draft' | 'active' | 'ended' = 'draft';
    if (now >= startsAt && now <= endsAt) {
      status = 'active';
    } else if (now > endsAt) {
      status = 'ended';
    }

    // Build complete election object
    const election: Election = {
      code,
      title: electionPayload.title,
      description: electionPayload.description || '',
      starts_at: electionPayload.starts_at,
      ends_at: electionPayload.ends_at,
      creator_id: requestUser.id,
      status,
      positions: electionPayload.positions,
      time_zone: electionPayload.time_zone || 'UTC',
      contract_address: contractAddress,
    };

    // Insert election into database
    const { data: insertedElection, error: insertError } = await supabase
      .from('elections')
      .insert(election)
      .select()
      .single();
    if (insertError) {
      throw new Error(`Failed to insert election: ${insertError.message}`);
    }

    if (!insertedElection || !insertedElection.id) {
      throw new Error('Election was inserted but no ID was returned');
    }

    const response: DeploymentResponse = {
      success: true,
      electionId: insertedElection.id,
      contractAddress,
      txHash, 
      message: 'Contract deployed successfully and transaction confirmed.'
    };

    return Response.json(response, { status: 200 });

  } catch (error) {
    // Return a 500 status code for server/deployment errors
    return handleApiError(error, 'deploy');
  }
}