// Middleware to sanitize request body inputs against XSS and unwanted HTML tags
const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return value
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // strip script tags
      .replace(/on\w+="[^"]*"/g, ""); // strip inline JS event handlers
  } else if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  } else if (value !== null && typeof value === "object") {
    const sanitizedObj = {};
    for (const key of Object.keys(value)) {
      sanitizedObj[key] = sanitizeValue(value[key]);
    }
    return sanitizedObj;
  }
  return value;
};

export const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
