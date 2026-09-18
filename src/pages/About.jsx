import React from 'react';
import { ShieldCheck, Zap, Ticket, Users } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: <Ticket size={36} />,
      title: "Seamless Ticketing",
      description: "Discover events and secure your tickets instantly. Our platform ensures a smooth checkout experience from start to finish."
    },
    {
      icon: <ShieldCheck size={36} />,
      title: "100% Secure Payments",
      description: "Powered by Paystack, we guarantee that all your transactions and financial data are encrypted and strictly protected."
    },
    {
      icon: <Zap size={36} />,
      title: "Instant QR Access",
      description: "No more paper tickets. Get dynamic QR codes delivered straight to your dashboard for blazing-fast event check-ins."
    },
    {
      icon: <Users size={36} />,
      title: "Built for Organizers",
      description: "Event creators get powerful tools to manage attendees, track real-time revenue, and scan tickets using our built-in scanner."
    }
  ];

  return (
    <div className="about-page">
      {/* Dark Hero Section */}
      <div className="about-hero animate-in fade-in duration-500">
        <h1>Redefining the Event Experience</h1>
        <p>
          TIKORA is the ultimate ticketing platform designed to connect people with the experiences they love, while empowering organizers with the tools they need to succeed.
        </p>
      </div>

      {/* Floating Content Box */}
      <div className="about-content-wrapper container animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="about-mission">
          <h2>Our Mission</h2>
          <p>
            We believe that attending events should be about creating memories, not stressing over logistics. We built this platform to eliminate ticketing fraud, streamline venue entry, and provide a transparent, premium experience for both event-goers and creators.
          </p>
        </div>

        <div className="about-features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="about-feature animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="about-feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default About;