import { check, validationResult } from 'express-validator';

export const createTicketValidationRules = () => [
  check('issueType').isIn(['Technical', 'Billing', 'Service', 'Other']).withMessage('Invalid issue type'),
  check('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters long'),
];

export const validateTicket = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
