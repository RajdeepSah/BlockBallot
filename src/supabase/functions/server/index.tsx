import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import * as bcrypt from 'npm:bcryptjs';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Utility: Generate random code
function generateCode(length = 7) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
}

// Utility: Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Utility: Generate receipt hash
function generateReceiptHash(ballotId: string, timestamp: number) {
  return `RCPT-${ballotId.substring(0, 8)}-${timestamp.toString(36).toUpperCase()}`;
}

// ========== AUTH ROUTES ==========

app.post('/make-server-b7b6fbd4/auth/register', async (c) => {
  try {
    const { name, email, phone, password } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Check if user exists
    const existingUser = await kv.get(`user:email:${email}`);
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (authError) {
      console.log('Auth creation error during registration:', authError);
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // Store user data
    const userData = {
      id: userId,
      name,
      email,
      phone: phone || null,
      twofa_method: 'email',
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, userData);
    await kv.set(`user:email:${email}`, userId);

    return c.json({
      success: true,
      message: 'User registered successfully',
      userId,
    });
  } catch (error) {
    console.log('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/make-server-b7b6fbd4/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing credentials' }, 400);
    }

    // Sign in with Supabase
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log('Sign in error during login:', signInError);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const userId = sessionData.user.id;
    const userData = await kv.get(`user:${userId}`);

    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Generate and store OTP for 2FA
    const otp = generateOTP();
    const otpData = {
      otp,
      userId,
      created_at: Date.now(),
      expires_at: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false,
    };

    await kv.set(`otp:${userId}`, otpData);

    console.log(`OTP for ${email}: ${otp} (This should be sent via email in production)`);

    return c.json({
      success: true,
      message: '2FA required',
      userId,
      accessToken: sessionData.session.access_token,
      requires2FA: true,
      // In production, don't return OTP - send via email
      devOTP: otp,
    });
  } catch (error) {
    console.log('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.post('/make-server-b7b6fbd4/auth/verify-2fa', async (c) => {
  try {
    const { userId, otp } = await c.req.json();

    if (!userId || !otp) {
      return c.json({ error: 'Missing OTP or user ID' }, 400);
    }

    const otpData = await kv.get(`otp:${userId}`);

    if (!otpData) {
      return c.json({ error: 'No OTP found for this user' }, 404);
    }

    if (Date.now() > otpData.expires_at) {
      await kv.del(`otp:${userId}`);
      return c.json({ error: 'OTP expired' }, 401);
    }

    if (otpData.otp !== otp) {
      return c.json({ error: 'Invalid OTP' }, 401);
    }

    // Mark OTP as verified and delete
    await kv.del(`otp:${userId}`);

    const userData = await kv.get(`user:${userId}`);

    return c.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      },
    });
  } catch (error) {
    console.log('2FA verification error:', error);
    return c.json({ error: '2FA verification failed' }, 500);
  }
});

app.post('/make-server-b7b6fbd4/auth/resend-otp', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'Missing user ID' }, 400);
    }

    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpData = {
      otp,
      userId,
      created_at: Date.now(),
      expires_at: Date.now() + 5 * 60 * 1000,
      verified: false,
    };

    await kv.set(`otp:${userId}`, otpData);

    console.log(`New OTP for ${userData.email}: ${otp}`);

    return c.json({
      success: true,
      message: 'OTP resent',
      devOTP: otp,
    });
  } catch (error) {
    console.log('Resend OTP error:', error);
    return c.json({ error: 'Failed to resend OTP' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/auth/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token' }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    return c.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      },
    });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// ========== ELECTION ROUTES ==========

app.post('/make-server-b7b6fbd4/elections', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, description, starts_at, ends_at, time_zone, positions } = body;

    if (!title || !starts_at || !ends_at || !positions || positions.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate unique election code
    let code = generateCode();
    let codeExists = await kv.get(`election:code:${code}`);

    while (codeExists) {
      code = generateCode();
      codeExists = await kv.get(`election:code:${code}`);
    }

    const electionId = crypto.randomUUID();
    const election = {
      id: electionId,
      code,
      title,
      description: description || '',
      starts_at,
      ends_at,
      time_zone: time_zone || 'UTC',
      creator_id: user.id,
      created_at: new Date().toISOString(),
      status: 'draft',
      positions: [],
    };

    // Process positions and candidates
    const positionsData = [];
    for (const position of positions) {
      const positionId = crypto.randomUUID();
      const positionData = {
        id: positionId,
        election_id: electionId,
        name: position.name,
        description: position.description || '',
        ballot_type: position.ballot_type || 'single',
        candidates: [],
      };

      // Process candidates
      if (position.candidates && position.candidates.length > 0) {
        for (const candidate of position.candidates) {
          const candidateId = crypto.randomUUID();
          const candidateData = {
            id: candidateId,
            election_id: electionId,
            position_id: positionId,
            name: candidate.name,
            description: candidate.description || '',
            photo_url: candidate.photo_url || null,
          };

          await kv.set(`candidate:${candidateId}`, candidateData);
          positionData.candidates.push(candidateId);
        }
      }

      await kv.set(`position:${positionId}`, positionData);
      positionsData.push(positionId);
    }

    election.positions = positionsData;

    await kv.set(`election:${electionId}`, election);
    await kv.set(`election:code:${code}`, electionId);

    // Track creator's elections
    const creatorElections = (await kv.get(`user:${user.id}:elections`)) || [];
    creatorElections.push(electionId);
    await kv.set(`user:${user.id}:elections`, creatorElections);

    return c.json({
      success: true,
      election: {
        id: electionId,
        code,
        title,
        description,
        positions: positionsData.length,
      },
    });
  } catch (error) {
    console.log('Create election error:', error);
    return c.json({ error: 'Failed to create election' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/elections/:id', async (c) => {
  try {
    const electionId = c.req.param('id');
    const election = await kv.get(`election:${electionId}`);

    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    // Load positions and candidates
    const positions = [];
    for (const positionId of election.positions) {
      const position = await kv.get(`position:${positionId}`);
      if (position) {
        const candidates = [];
        for (const candidateId of position.candidates) {
          const candidate = await kv.get(`candidate:${candidateId}`);
          if (candidate) {
            candidates.push(candidate);
          }
        }
        positions.push({ ...position, candidates });
      }
    }

    return c.json({
      ...election,
      positions,
    });
  } catch (error) {
    console.log('Get election error:', error);
    return c.json({ error: 'Failed to get election' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/elections', async (c) => {
  try {
    const code = c.req.query('code');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    let userId = null;
    if (accessToken) {
      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken);
      userId = user?.id;
    }

    if (code) {
      // Search by code
      const electionId = await kv.get(`election:code:${code.toUpperCase()}`);
      if (!electionId) {
        return c.json({ elections: [] });
      }

      const election = await kv.get(`election:${electionId}`);
      if (!election) {
        return c.json({ elections: [] });
      }

      return c.json({ elections: [election] });
    }

    if (userId) {
      // Get user's created elections
      const createdElections = (await kv.get(`user:${userId}:elections`)) || [];
      const elections = [];

      for (const electionId of createdElections) {
        const election = await kv.get(`election:${electionId}`);
        if (election) {
          elections.push(election);
        }
      }

      // Get elections user is eligible for
      const eligibilityKeys = await kv.getByPrefix(`eligibility:`);
      const eligibleElectionIds = new Set();

      for (const eligibility of eligibilityKeys) {
        if (
          eligibility.user_id === userId &&
          (eligibility.status === 'approved' || eligibility.status === 'preapproved')
        ) {
          eligibleElectionIds.add(eligibility.election_id);
        }
      }

      for (const electionId of eligibleElectionIds) {
        if (!createdElections.includes(electionId)) {
          const election = await kv.get(`election:${electionId}`);
          if (election) {
            elections.push(election);
          }
        }
      }

      return c.json({ elections });
    }

    return c.json({ elections: [] });
  } catch (error) {
    console.log('List elections error:', error);
    return c.json({ error: 'Failed to list elections' }, 500);
  }
});

app.post('/make-server-b7b6fbd4/elections/:id/eligibility', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const election = await kv.get(`election:${electionId}`);

    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    if (election.creator_id !== user.id) {
      return c.json({ error: 'Only election creator can upload eligibility list' }, 403);
    }

    const { voters } = await c.req.json();

    if (!voters || !Array.isArray(voters)) {
      return c.json({ error: 'Invalid voter list' }, 400);
    }

    let addedCount = 0;
    for (const voterEmail of voters) {
      if (!voterEmail || typeof voterEmail !== 'string') continue;

      const email = voterEmail.trim().toLowerCase();
      const eligibilityId = crypto.randomUUID();

      // Check if user exists with this email
      const existingUserId = await kv.get(`user:email:${email}`);

      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: email,
        user_id: existingUserId || null,
        status: 'preapproved',
        created_at: new Date().toISOString(),
      };

      await kv.set(`eligibility:${electionId}:${email}`, eligibility);
      addedCount++;
    }

    return c.json({
      success: true,
      message: `Added ${addedCount} voters to eligibility list`,
    });
  } catch (error) {
    console.log('Upload eligibility error:', error);
    return c.json({ error: 'Failed to upload eligibility list' }, 500);
  }
});

app.post('/make-server-b7b6fbd4/elections/:id/access-request', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const election = await kv.get(`election:${electionId}`);

    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    const eligibility = await kv.get(`eligibility:${electionId}:${userData.email}`);
    const existingRequest = await kv.get(`access_request:${electionId}:${user.id}`);

    const removeExistingRequest = async (request: any) => {
      if (!request) return;
      await kv.del(`access_request:${electionId}:${request.user_id}`);
      if (request.id) {
        await kv.del(`access_request:${request.id}`);
      }
    };

    const isAlreadyApproved =
      eligibility && (eligibility.status === 'approved' || eligibility.status === 'preapproved');

    if (isAlreadyApproved) {
      if (existingRequest) {
        await removeExistingRequest(existingRequest);
      }
      return c.json({
        status: 'already-approved',
        message: 'You are already approved to vote in this election.',
      });
    }

    if (existingRequest) {
      if (existingRequest.status === 'denied') {
        await removeExistingRequest(existingRequest);
      } else if (existingRequest.status === 'approved') {
        await removeExistingRequest(existingRequest);
        return c.json({
          status: 'already-approved',
          message: 'You are already approved to vote in this election.',
        });
      } else {
        return c.json({
          status: existingRequest.status || 'pending',
          message: 'Access request already exists',
        });
      }
    }

    const requestId = crypto.randomUUID();
    const accessRequest = {
      id: requestId,
      election_id: electionId,
      user_id: user.id,
      contact: userData.email,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await kv.set(`access_request:${electionId}:${user.id}`, accessRequest);
    await kv.set(`access_request:${requestId}`, accessRequest);

    return c.json({
      success: true,
      message: 'Access request submitted',
      status: 'pending',
      requestId,
    });
  } catch (error) {
    console.log('Access request error:', error);
    return c.json({ error: 'Failed to submit access request' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/elections/:id/access-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const election = await kv.get(`election:${electionId}`);

    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    if (election.creator_id !== user.id) {
      return c.json({ error: 'Only election creator can view access requests' }, 403);
    }

    const allRequests = await kv.getByPrefix(`access_request:${electionId}:`);
    const requests = allRequests.filter((req) => req.election_id === electionId);

    // Enrich with user data
    const enrichedRequests = [];
    for (const request of requests) {
      const userData = await kv.get(`user:${request.user_id}`);
      enrichedRequests.push({
        ...request,
        user_name: userData?.name || 'Unknown',
        user_email: userData?.email || request.contact,
      });
    }

    return c.json({ requests: enrichedRequests });
  } catch (error) {
    console.log('Get access requests error:', error);
    return c.json({ error: 'Failed to get access requests' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/elections/:id/preapproved-voters', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const election = await kv.get(`election:${electionId}`);

    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    if (election.creator_id !== user.id) {
      return c.json({ error: 'Only election creator can view pre-approved voters' }, 403);
    }

    const eligibilityRecords = await kv.getByPrefix(`eligibility:${electionId}:`);
    const voters = [];

    for (const record of eligibilityRecords) {
      if (!record || (record.status !== 'preapproved' && record.status !== 'approved')) {
        continue;
      }

      let userId = record.user_id;
      if (!userId) {
        userId = await kv.get(`user:email:${record.contact}`);
      }

      let fullName = 'Pending Registration';
      if (userId) {
        const userData = await kv.get(`user:${userId}`);
        if (userData?.name) {
          fullName = userData.name;
        } else if (userData?.email) {
          fullName = userData.email;
        }
      }

      voters.push({
        id: record.id ?? record.contact,
        email: record.contact,
        full_name: fullName,
      });
    }

    voters.sort((a, b) => a.email.localeCompare(b.email));

    return c.json({ voters });
  } catch (error) {
    console.log('Get preapproved voters error:', error);
    return c.json({ error: 'Failed to get pre-approved voters' }, 500);
  }
});

app.patch('/make-server-b7b6fbd4/elections/:id/access-requests/:requestId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const requestId = c.req.param('requestId');
    const { action } = await c.req.json();

    if (!action || !['approve', 'deny'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    const election = await kv.get(`election:${electionId}`);
    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    if (election.creator_id !== user.id) {
      return c.json({ error: 'Only election creator can manage access requests' }, 403);
    }

    const request = await kv.get(`access_request:${requestId}`);
    if (!request || request.election_id !== electionId) {
      return c.json({ error: 'Access request not found' }, 404);
    }

    const requestKeyByElection = `access_request:${electionId}:${request.user_id}`;
    const requestKeyById = `access_request:${requestId}`;

    if (action === 'approve') {
      const userData = await kv.get(`user:${request.user_id}`);
      const eligibilityId = crypto.randomUUID();
      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: userData.email,
        user_id: request.user_id,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      await kv.set(`eligibility:${electionId}:${userData.email}`, eligibility);
      await kv.del(requestKeyByElection);
      await kv.del(requestKeyById);
    } else {
      request.status = 'denied';
      request.decided_by = user.id;
      request.decided_at = new Date().toISOString();
      await kv.set(requestKeyById, request);
      await kv.set(requestKeyByElection, request);
    }

    return c.json({
      success: true,
      message: `Access request ${action}d`,
    });
  } catch (error) {
    console.log('Update access request error:', error);
    return c.json({ error: 'Failed to update access request' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/elections/:id/eligibility-status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const userData = await kv.get(`user:${user.id}`);

    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check eligibility
    const eligibility = await kv.get(`eligibility:${electionId}:${userData.email}`);

    // Check if already voted
    const ballotLink = await kv.get(`ballot:link:${electionId}:${user.id}`);

    // Check access request
    let accessRequest = await kv.get(`access_request:${electionId}:${user.id}`);

    const isEligible =
      eligibility && (eligibility.status === 'approved' || eligibility.status === 'preapproved');

    if (isEligible && accessRequest) {
      await kv.del(`access_request:${electionId}:${user.id}`);
      if (accessRequest.id) {
        await kv.del(`access_request:${accessRequest.id}`);
      }
      accessRequest = null;
    }

    return c.json({
      eligible: isEligible,
      hasVoted: !!ballotLink,
      accessRequest: accessRequest
        ? {
            status: accessRequest.status,
            id: accessRequest.id,
          }
        : null,
    });
  } catch (error) {
    console.log('Check eligibility error:', error);
    return c.json({ error: 'Failed to check eligibility' }, 500);
  }
});

app.post('/make-server-b7b6fbd4/elections/:id/cast-vote', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const electionId = c.req.param('id');
    const { votes } = await c.req.json();

    if (!votes || typeof votes !== 'object') {
      return c.json({ error: 'Invalid vote data' }, 400);
    }

    const election = await kv.get(`election:${electionId}`);
    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    // Check if election is active
    const now = new Date();
    const startsAt = new Date(election.starts_at);
    const endsAt = new Date(election.ends_at);

    if (now < startsAt) {
      return c.json({ error: 'Election has not started yet' }, 400);
    }

    if (now > endsAt) {
      return c.json({ error: 'Election has ended' }, 400);
    }

    // Check eligibility
    const userData = await kv.get(`user:${user.id}`);
    const eligibility = await kv.get(`eligibility:${electionId}:${userData.email}`);

    if (
      !eligibility ||
      (eligibility.status !== 'approved' && eligibility.status !== 'preapproved')
    ) {
      return c.json({ error: 'You are not eligible to vote in this election' }, 403);
    }

    // Check if already voted
    const existingBallotLink = await kv.get(`ballot:link:${electionId}:${user.id}`);
    if (existingBallotLink) {
      return c.json({ error: 'You have already voted in this election' }, 400);
    }

    // Create ballot
    const ballotId = crypto.randomUUID();
    const timestamp = Date.now();
    const receiptHash = generateReceiptHash(ballotId, timestamp);

    const ballot = {
      id: ballotId,
      election_id: electionId,
      cast_at: new Date().toISOString(),
      receipt_hash: receiptHash,
      selections: [],
    };

    // Store selections
    for (const [positionId, selection] of Object.entries(votes)) {
      if (Array.isArray(selection)) {
        // Multiple or ranked choice
        for (let i = 0; i < selection.length; i++) {
          ballot.selections.push({
            position_id: positionId,
            candidate_id: selection[i],
            rank: i + 1,
          });
        }
      } else {
        // Single choice
        ballot.selections.push({
          position_id: positionId,
          candidate_id: selection,
          rank: null,
        });
      }
    }

    await kv.set(`ballot:${ballotId}`, ballot);

    // Create ballot link (proof of voting without linking to selections)
    const ballotLink = {
      id: crypto.randomUUID(),
      election_id: electionId,
      user_id: user.id,
      ballot_id: ballotId,
      created_at: new Date().toISOString(),
    };

    await kv.set(`ballot:link:${electionId}:${user.id}`, ballotLink);

    // Audit trail
    const auditEntry = {
      id: crypto.randomUUID(),
      ballot_id: ballotId,
      timestamp: new Date().toISOString(),
      receipt_hash: receiptHash,
    };

    await kv.set(`audit:${ballotId}`, auditEntry);

    return c.json({
      success: true,
      message: 'Vote cast successfully',
      receipt: receiptHash,
      timestamp: ballot.cast_at,
    });
  } catch (error) {
    console.log('Cast vote error:', error);
    return c.json({ error: 'Failed to cast vote' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/elections/:id/results', async (c) => {
  try {
    const electionId = c.req.param('id');
    const election = await kv.get(`election:${electionId}`);

    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    let isCreator = false;

    if (accessToken) {
      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken);
      isCreator = user && user.id === election.creator_id;
    }

    // Check if election has ended or if user is creator
    const now = new Date();
    const endsAt = new Date(election.ends_at);
    const hasEnded = now > endsAt;

    if (!hasEnded && !isCreator) {
      return c.json({ error: 'Results not available yet' }, 403);
    }

    // Get all ballots for this election
    const allBallots = await kv.getByPrefix(`ballot:`);
    const electionBallots = allBallots.filter((b) => b.election_id === electionId && b.id);

    // Count votes by position and candidate
    const results = {};
    let totalVotes = 0;

    for (const ballot of electionBallots) {
      totalVotes++;

      for (const selection of ballot.selections) {
        if (!results[selection.position_id]) {
          results[selection.position_id] = {};
        }

        if (!results[selection.position_id][selection.candidate_id]) {
          results[selection.position_id][selection.candidate_id] = {
            votes: 0,
            ranks: [],
          };
        }

        results[selection.position_id][selection.candidate_id].votes++;

        if (selection.rank !== null) {
          results[selection.position_id][selection.candidate_id].ranks.push(selection.rank);
        }
      }
    }

    // Get eligibility count
    const eligibilityRecords = await kv.getByPrefix(`eligibility:${electionId}:`);
    const eligibleVoters = eligibilityRecords.filter(
      (e) => e.election_id === electionId && (e.status === 'approved' || e.status === 'preapproved')
    ).length;

    // Format results with candidate details
    const formattedResults = {};

    for (const positionId of election.positions) {
      const position = await kv.get(`position:${positionId}`);
      if (!position) continue;

      formattedResults[positionId] = {
        position_name: position.name,
        ballot_type: position.ballot_type,
        candidates: [],
      };

      for (const candidateId of position.candidates) {
        const candidate = await kv.get(`candidate:${candidateId}`);
        if (!candidate) continue;

        const voteData = results[positionId]?.[candidateId] || { votes: 0, ranks: [] };

        formattedResults[positionId].candidates.push({
          id: candidateId,
          name: candidate.name,
          description: candidate.description,
          photo_url: candidate.photo_url,
          votes: voteData.votes,
          percentage: totalVotes > 0 ? ((voteData.votes / totalVotes) * 100).toFixed(2) : '0.00',
        });
      }

      // Sort by votes descending
      formattedResults[positionId].candidates.sort((a, b) => b.votes - a.votes);
    }

    return c.json({
      election_id: electionId,
      election_title: election.title,
      total_votes: totalVotes,
      eligible_voters: eligibleVoters,
      turnout_percentage:
        eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(2) : '0.00',
      results: formattedResults,
      has_ended: hasEnded,
    });
  } catch (error) {
    console.log('Get results error:', error);
    return c.json({ error: 'Failed to get results' }, 500);
  }
});

app.get('/make-server-b7b6fbd4/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
