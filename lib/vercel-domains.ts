type VercelAttachResult = {
  attached: boolean;
  message: string;
};

const VERCEL_API_BASE = 'https://api.vercel.com';

function getVercelConfig(): { token: string; projectId: string; teamId?: string } {
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    throw new Error('Vercel domain attach is not configured. Set VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID.');
  }

  return { token, projectId, teamId };
}

function buildVercelUrl(pathname: string, teamId?: string): string {
  const url = new URL(`${VERCEL_API_BASE}${pathname}`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }
  return url.toString();
}

export async function attachDomainToVercelProject(domain: string): Promise<VercelAttachResult> {
  const { token, projectId, teamId } = getVercelConfig();

  const attachResponse = await fetch(buildVercelUrl(`/v10/projects/${projectId}/domains`, teamId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
    cache: 'no-store',
  });

  let payload: unknown = null;
  try {
    payload = await attachResponse.json();
  } catch {
    payload = null;
  }

  if (attachResponse.ok) {
    return {
      attached: true,
      message: 'Domain attached to Vercel project successfully.',
    };
  }

  const asRecord = payload as { error?: { code?: string; message?: string }; message?: string } | null;
  const errorCode = asRecord?.error?.code;
  const errorMessage = asRecord?.error?.message || asRecord?.message || 'Unknown Vercel API error.';

  if (errorCode === 'domain_already_exists' || errorCode === 'domain_already_in_use') {
    return {
      attached: false,
      message: 'This domain is already attached to another Vercel project/team.',
    };
  }

  throw new Error(`Vercel attach failed (${attachResponse.status}): ${errorMessage}`);
}
