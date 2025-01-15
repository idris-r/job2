import React from 'react';
import './Billing.css';
import { SectionHeader } from '../common/CommonComponents';
import { PRICING_TIERS, FEATURE_DESCRIPTIONS } from '../../constants/pricing';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircleIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ChatBubbleBottomCenterTextIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

const Billing = () => {
  const { user } = useAuth();

  const handlePurchase = async (tier) => {
    // Implement purchase logic here
    console.log('Purchase tier:', tier);
  };

  return (
    <div className="billing-section">
      <SectionHeader>Billing & Tokens</SectionHeader>

      <div className="pricing-container">
        <div className="pricing-header">
          <h3>Purchase Tokens</h3>
          <p>Choose the plan that best fits your needs</p>
        </div>
        <div className="pricing-grid">
          {Object.values(PRICING_TIERS).map((tier) => (
            <div key={tier.label} className={`pricing-card ${tier.popular ? 'popular' : ''}`}>
              {tier.popular && <span className="popular-badge">Most Popular</span>}
              <div className="card-header">
                <div className="plan-name">{tier.label}</div>
                <div className="plan-price">${tier.price}</div>
                <div className="plan-tokens">{tier.tokens} tokens</div>
              </div>
              <ul className="plan-features">
                {tier.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <CheckCircleIcon className="feature-icon" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className="purchase-button"
                onClick={() => handlePurchase(tier)}
                disabled={!user}
              >
                <ShoppingCartIcon className="purchase-button-icon" />
                {user ? 'Purchase Now' : 'Login to Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="token-costs">
        <div className="costs-header">
          <h3>Token Costs</h3>
        </div>
        <div className="costs-grid">
          {Object.entries(FEATURE_DESCRIPTIONS).map(([key, feature]) => {
            const Icon = key === 'ANALYSIS' ? DocumentTextIcon :
                       key === 'COVER_LETTER' ? DocumentDuplicateIcon :
                       ChatBubbleBottomCenterTextIcon;
            
            return (
              <div key={key} className="cost-card">
                <div className="cost-header">
                  <Icon className="cost-icon" />
                  <div className="cost-title">
                    <div className="cost-name">{feature.name}</div>
                    <div className="cost-tokens">
                      <CurrencyDollarIcon className="token-icon" />
                      {feature.tokens} tokens
                    </div>
                  </div>
                </div>
                <div className="cost-description">
                  {feature.description}
                </div>
                <div className="cost-details">
                  {feature.details}
                </div>
              </div>
            )}
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
