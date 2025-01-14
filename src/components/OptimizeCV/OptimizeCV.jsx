import React from 'react';
import './OptimizeCV.css';
import { BaseComponent } from '../common/BaseComponent';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { SectionHeader } from '../common/CommonComponents';

class OptimizeCV extends BaseComponent {
  state = {
    improvements: [],
    error: null
  };

  componentDidMount() {
    if (this.props.optimizedCV) {
      this.processImprovements();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.optimizedCV !== this.props.optimizedCV && this.props.optimizedCV) {
      this.processImprovements();
    }
  }

  processImprovements = () => {
    try {
      let parsedResponse;
      if (typeof this.props.optimizedCV === 'string') {
        const jsonMatch = this.props.optimizedCV.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not find JSON in response');
        }
      } else if (typeof this.props.optimizedCV === 'object') {
        parsedResponse = this.props.optimizedCV;
      } else {
        throw new Error('Invalid response format');
      }

      if (!parsedResponse || !Array.isArray(parsedResponse.improvements)) {
        throw new Error('Invalid response structure');
      }

      this.setState({
        improvements: parsedResponse.improvements,
        error: null
      });
    } catch (error) {
      console.error('Error processing improvements:', error);
      this.setState({ 
        error: 'Failed to process improvements. Please try again.',
        improvements: []
      });
    }
  };

  getImpactClass = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      case 'low': return 'impact-low';
      default: return 'impact-medium';
    }
  };

  renderImprovement = (improvement, index) => {
    return (
      <div key={index} className="improvement-card">
        <div className="improvement-header">
          <LightBulbIcon className="improvement-icon" />
          <span className="improvement-title">{improvement.location}</span>
          <span className={`impact-badge ${this.getImpactClass(improvement.impact)}`}>
            {improvement.impact} Impact
          </span>
        </div>

        <div className="comparison-container">
          <div className="text-block original">
            {improvement.original}
          </div>
          <div className="text-block improved">
            {improvement.improved}
          </div>
        </div>

        {improvement.matchedRequirements && (
          <div className="matched-requirements">
            <h4>Matches Job Requirements</h4>
            <div className="requirements-list">
              {improvement.matchedRequirements.map((req, i) => (
                <span key={i} className="requirement-tag">{req}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  render() {
    const { isLoading } = this.props;
    const { improvements, error } = this.state;

    if (isLoading) {
      return this.renderLoading(true, "Analyzing CV for improvements...");
    }

    if (!improvements.length) {
      return (
        <div className="optimize-section">
          <SectionHeader>CV Improvements</SectionHeader>
          <div className="empty-state">
            No improvements available yet. Please ensure you've analyzed your CV first.
          </div>
        </div>
      );
    }

    return (
      <div className="optimize-section">
        <SectionHeader>CV Improvements</SectionHeader>
        {error && this.renderError(error)}

        <div className="improvements-container">
          {improvements.map((improvement, index) =>
            this.renderImprovement(improvement, index)
          )}
        </div>
      </div>
    );
  }
}

export default OptimizeCV;
