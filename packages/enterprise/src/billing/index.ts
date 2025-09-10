// Placeholder for Stripe billing integration
export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export const billingPlans: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    features: ['Up to 5 platforms', 'Basic analytics', 'Email alerts'],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29.99,
    features: ['Unlimited platforms', 'Advanced analytics', 'Slack integration', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    features: ['All Pro features', 'Custom branding', 'SSO integration', 'Priority support'],
  },
];