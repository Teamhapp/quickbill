
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave }) => {
  const [profile, setProfile] = useState<UserProfile>(user);

  const handleSave = () => {
    onSave(profile);
    alert('Business Profile Updated!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Profile</h2>
        <p className="text-gray-500">This information will appear on your invoices</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Business Name</label>
            <input 
              type="text" 
              value={profile.businessName}
              onChange={e => setProfile({...profile, businessName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Address</label>
            <textarea 
              value={profile.address}
              onChange={e => setProfile({...profile, address: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GSTIN</label>
              <input 
                type="text" 
                value={profile.gstin}
                onChange={e => setProfile({...profile, gstin: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
              <input 
                type="text" 
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              value={profile.email}
              onChange={e => setProfile({...profile, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            UPDATE PROFILE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
