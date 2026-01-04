import React, { useState, useEffect } from 'react';
import { Save, Server, Mail, MessageSquare, Shield } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const GlobalSettings = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    // Branding
    app_name: '',
    company_name: '',
    support_email: '',
    support_phone: '',
    
    // System SMTP
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    
    // Welcome Email (NEW EDITABLE FIELDS)
    welcome_email_subject: '',
    welcome_email_body: ''
  });

  // Fetch Current Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/super-admin/platform-settings/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setFormData(res.data);
        }
      } catch (err) {
        console.error("Failed to load settings");
      }
    };
    fetchSettings();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      // Use FormData to handle potential file uploads (logo) in future
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      await axios.post(`${API_URL}/api/super-admin/platform-settings/`, data, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      
      setMsg({ type: 'success', text: 'Global Configuration Saved Successfully!' });
      
      // Force reload to update Sidebar branding immediately
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Infrastructure</h1>
          <p className="text-gray-500">Configure your SaaS branding, mail servers, and templates.</p>
        </div>
        <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
          <Server size={24} />
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 mb-6 rounded-lg ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. BRANDING */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-blue-500" /> Software Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
              <input 
                type="text" name="app_name" 
                value={formData.app_name} onChange={handleChange}
                className="w-full p-2 border rounded-lg" placeholder="e.g. Atithi HMS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Legal)</label>
              <input 
                type="text" name="company_name" 
                value={formData.company_name} onChange={handleChange}
                className="w-full p-2 border rounded-lg" placeholder="e.g. My Tech Pvt Ltd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input 
                type="email" name="support_email" 
                value={formData.support_email} onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
              <input 
                type="text" name="support_phone" 
                value={formData.support_phone} onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 2. SMTP SETTINGS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Mail size={18} className="text-orange-500" /> System SMTP (Global Fallback)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="smtp_host" value={formData.smtp_host} onChange={handleChange} className="p-2 border rounded-lg" placeholder="SMTP Host (e.g. smtp.gmail.com)" />
            <input type="text" name="smtp_port" value={formData.smtp_port} onChange={handleChange} className="p-2 border rounded-lg" placeholder="Port (e.g. 587)" />
            <input type="text" name="smtp_user" value={formData.smtp_user} onChange={handleChange} className="p-2 border rounded-lg" placeholder="SMTP Email" />
            <input type="password" name="smtp_password" value={formData.smtp_password} onChange={handleChange} className="p-2 border rounded-lg" placeholder="SMTP App Password" />
          </div>
        </div>

        {/* 3. WELCOME EMAIL TEMPLATE (NEW) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-green-500" /> Welcome Email Template
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
              <input 
                type="text" name="welcome_email_subject" 
                value={formData.welcome_email_subject} onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Body 
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  Use placeholders: {"{name}"}, {"{username}"}, {"{password}"}, {"{app_name}"}
                </span>
              </label>
              <textarea 
                name="welcome_email_body" 
                value={formData.welcome_email_body} onChange={handleChange}
                rows="8"
                className="w-full p-2 border rounded-lg font-mono text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {loading ? 'Saving Configuration...' : 'Save Global Configuration'}
        </button>

      </form>
    </div>
  );
};

export default GlobalSettings;