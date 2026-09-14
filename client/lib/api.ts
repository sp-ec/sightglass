// NEXT_PUBLIC_API_URL is the relative "/api", which the Next rewrite forwards
// to Express. Relative URLs only resolve in the browser, so these helpers must
// not be called from a Server Component.
const apiUrl = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;

export class UnauthorizedError extends Error {
	constructor() {
		super("Not authenticated");
		this.name = "UnauthorizedError";
	}
}

export const apiFetch = async (
	path: string,
	init?: RequestInit,
): Promise<Response> => {
	const response = await fetch(apiUrl(path), init);
	if (response.status === 401) {
		throw new UnauthorizedError();
	}

	return response;
};

export const postJson = async (
	path: string,
	body: unknown,
): Promise<Response> =>
	fetch(apiUrl(path), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

// Falls back to a generic message when the server returns a non-JSON error
export const readErrorMessage = async (
	response: Response,
	fallback: string,
): Promise<string> => {
	try {
		const body = (await response.json()) as { message?: string };
		return body.message ?? fallback;
	} catch {
		return fallback;
	}
};
