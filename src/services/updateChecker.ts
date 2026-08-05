import { APP_VERSION, GITHUB_REPO_URL } from '../config/version';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  releaseUrl: string;
  body?: string;
}

export const UpdateCheckerService = {
  async checkForUpdates(): Promise<UpdateCheckResult | null> {
    try {
      const res = await fetch('https://api.github.com/repos/nguyenngoctrung007/engion/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) return null;
      const data = await res.json();

      const rawTagName = (data.tag_name || '').trim();
      const latestVersion = rawTagName.replace(/^v/i, '');
      const currentVersion = APP_VERSION.replace(/^v/i, '');

      if (latestVersion && latestVersion !== currentVersion) {
        return {
          hasUpdate: true,
          latestVersion: rawTagName || `v${latestVersion}`,
          releaseUrl: data.html_url || `${GITHUB_REPO_URL}/releases/latest`,
          body: data.body
        };
      }
    } catch {
      // Ignore network failures gracefully
    }
    return null;
  }
};
