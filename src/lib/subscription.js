// frontend/src/lib/subscription.js
export const getPlan = () => localStorage.getItem("plan") || "free";
export const setPlan = (plan) => localStorage.setItem("plan", plan);