import { Request, Response, Middleware } from '../types.js';

type ValidationRule = (value: any) => string | null;

export function validate(rules: Record<string, ValidationRule>): Middleware {
  return (req: Request, res: Response, next: () => void) => {
    const errors: Record<string, string> = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body?.[field];
      const error = rule(value);
      if (error) {
        errors[field] = error;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      res.json({ error: 'Validation failed', errors }, 400);
      return;
    }
    
    next();
  };
}

export const rules = {
  required: (value: any) => (!value ? 'This field is required' : null),
  string: (value: any) => (typeof value !== 'string' ? 'Must be a string' : null),
  url: (value: any) => {
    if (typeof value !== 'string') return 'Must be a string';
    try {
      new URL(value);
      return null;
    } catch {
      return 'Must be a valid URL';
    }
  },
  githubRepo: (value: any) => {
    if (typeof value !== 'string') return 'Must be a string';
    const pattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    return pattern.test(value) ? null : 'Must be a valid GitHub repository URL';
  },
};
