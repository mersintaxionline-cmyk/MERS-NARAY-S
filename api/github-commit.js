export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Sadece POST desteklenir' });
    }

    try {
        const { filePath, content, message } = req.body || {};
        if (!filePath || typeof content !== 'string') {
            return res.status(400).json({ ok: false, error: 'filePath veya content eksik' });
        }

        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const branch = process.env.GITHUB_BRANCH || 'main';
        const token = process.env.GITHUB_TOKEN;

        if (!owner || !repo || !token) {
            return res.status(500).json({ ok: false, error: 'Vercel Environment Variables eksik: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN' });
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        let sha = undefined;

        const getFile = await fetch(`${apiUrl}?ref=${branch}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
        });

        if (getFile.ok) {
            const oldFile = await getFile.json();
            sha = oldFile.sha;
        }

        const saveFile = await fetch(apiUrl, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message || 'CJ panel yayın güncellemesi', content: Buffer.from(content, 'utf8').toString('base64'), branch, sha })
        });

        const result = await saveFile.json();
        if (!saveFile.ok) return res.status(500).json({ ok: false, error: result.message || 'GitHub kaydı başarısız' });
        return res.status(200).json({ ok: true, commit: result.commit?.sha || null });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
