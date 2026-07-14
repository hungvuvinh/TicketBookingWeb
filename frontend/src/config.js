function normalizeApiBase(value) {
	if (!value) {
		return "https://backendticketbooking.onrender.com/api";
	}

	return value.endsWith("/api") ? value : `${value.replace(/\/$/, "")}/api`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);