import React, { useEffect } from 'react';

const PrivacyPolicy = () => {
  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#333', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '36px', color: '#111', marginBottom: '10px', fontFamily: 'Space Grotesk, sans-serif' }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Last Updated: October 2026</p>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', color: '#111', marginTop: '30px', marginBottom: '15px' }}>1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you use Tickora:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Personal Data:</strong> Name, email address, phone number, and account passwords (securely hashed).</li>
          <li style={{ marginBottom: '8px' }}><strong>Third-Party Auth:</strong> If you register using Google, we receive your basic profile information (name, email, and avatar).</li>
          <li style={{ marginBottom: '8px' }}><strong>Financial Data:</strong> For Organizers, we collect bank account details strictly for processing payouts. We do not store buyer credit card details; all ticket payments are securely processed by our third-party payment gateway (e.g., Paystack).</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', color: '#111', marginTop: '30px', marginBottom: '15px' }}>2. How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
          <li>Process ticket purchases and generate unique QR codes.</li>
          <li>Facilitate organizer payouts and calculate platform revenue.</li>
          <li>Send administrative emails (e.g., ticket confirmations, password resets, payout approvals).</li>
          <li>Provide customer support and monitor platform security to prevent fraud.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', color: '#111', marginTop: '30px', marginBottom: '15px' }}>3. Information Sharing</h2>
        <p>We do not sell your personal data. We only share information in the following circumstances:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
          <li><strong>With Event Organizers:</strong> When you buy a ticket, the Organizer receives your name and email to manage their guest list.</li>
          <li><strong>With Service Providers:</strong> We share data with trusted third parties (like cloud hosting and payment processors) strictly to operate our platform.</li>
          <li><strong>For Legal Reasons:</strong> We may disclose information if required by law or to protect the safety and rights of Tickora and its users.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', color: '#111', marginTop: '30px', marginBottom: '15px' }}>4. Data Security</h2>
        <p>We implement industry-standard security measures (including TLS encryption and secure JWT authentication) to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', color: '#111', marginTop: '30px', marginBottom: '15px' }}>5. Your Rights</h2>
        <p>You have the right to access, update, or delete your account information at any time via your dashboard. If you wish to permanently delete your data from our servers, please contact us.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '40px 0' }} />
      <p style={{ fontSize: '14px', color: '#777' }}>For privacy-related inquiries, please contact tickora@gmail.com.</p>
    </main>
  );
};

export default PrivacyPolicy;
