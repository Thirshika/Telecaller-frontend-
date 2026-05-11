const BASE_URL = "http://localhost:5000/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  getProspects: () => fetchWithAuth("/prospects"),
  createProspect: (data: any) => fetchWithAuth("/prospects", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  bulkImportProspects: (prospects: any[]) => fetchWithAuth("/prospects/bulk", {
    method: "POST",
    body: JSON.stringify({ prospects }),
  }),
  updateProspect: (id: string, data: any) => fetchWithAuth(`/prospects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  getUsers: () => fetchWithAuth("/users"),
  getTelecallers: () => fetchWithAuth("/users/telecallers"),
  createUser: (data: any) => fetchWithAuth("/users", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  createCallLog: (data: any) => fetchWithAuth("/call-logs", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getProspectCallLogs: (prospectId: string) => fetchWithAuth(`/prospects/${prospectId}/call-logs`),
  getCallLogs: (telecallerId: string) => fetchWithAuth(`/telecallers/${telecallerId}/call-logs`),
  deleteCallLog: (id: string) => fetchWithAuth(`/call-logs/${id}`, {
    method: "DELETE",
  }),
  assignLeads: (data: { leadIds: string[], telecallerId: string }) => fetchWithAuth("/leads/assign", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  distributeLeads: (data: { telecallerId: string, numLeads: number }) => fetchWithAuth("/leads/distribute", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getSpocStats: (spocId?: string) => fetchWithAuth(`/spoc/stats${spocId ? `?spocId=${spocId}` : ""}`),
  getAdminStats: () => fetchWithAuth("/admin/stats"),
  getFieldReports: (spocId?: string) => fetchWithAuth(`/field-reports${spocId ? `?spocId=${spocId}` : ""}`),
  createFieldReport: (data: any) => fetchWithAuth("/field-reports", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getFollowUps: (telecallerId: string) => fetchWithAuth(`/telecallers/${telecallerId}/follow-ups`),
  getSpocFollowUps: (spocId: string) => fetchWithAuth(`/spocs/${spocId}/follow-ups`),
  getAllFollowUps: () => fetchWithAuth("/follow-ups"),
  createFollowUp: (data: any) => fetchWithAuth("/follow-ups", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateFollowUp: (id: string, data: any) => fetchWithAuth(`/follow-ups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteFollowUp: (id: string) => fetchWithAuth(`/follow-ups/${id}`, {
    method: "DELETE",
  }),
  getCourses: () => fetchWithAuth("/courses"),
  createCourse: (data: any) => fetchWithAuth("/courses", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateCourse: (id: string, data: any) => fetchWithAuth(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteCourse: (id: string) => fetchWithAuth(`/courses/${id}`, {
    method: "DELETE",
  }),
};
