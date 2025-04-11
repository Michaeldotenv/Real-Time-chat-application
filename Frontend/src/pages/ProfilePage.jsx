import { useState, useEffect, useRef } from 'react';
import { Camera, User, Mail, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast, { Toaster } from 'react-hot-toast';

const ProfilePage = () => {
  const { authUser, updateProfileImage, isUpdatingProfile } = useAuthStore();
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with 0.7 quality
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
              resolve(reader.result);
            };
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB allowed');
      return;
    }

    try {
      toast.loading('Processing image...');
      const compressedImage = await compressImage(file);
      await updateProfileImage(compressedImage);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to update profile image');
    } finally {
      toast.dismiss();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-white py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl text-base-content font-bold mb-2">Your Profile</h1>
          <p className="text-base-content">View your personal information</p>
        </div>

        <div className="bg-base-100 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8">
            <div className="relative w-32 h-32 mx-auto group">
              <div 
                className={`absolute inset-0 rounded-full bg-gray-800 bg-opacity-70 flex items-center justify-center transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={triggerFileInput}
              >
                <div className="cursor-pointer flex flex-col items-center">
                  <Camera className="h-8 w-8 text-white" />
                  <span className="text-xs mt-1">Update</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUpdatingProfile}
                />
              </div>
              <img
                src={authUser?.profilePic || `https://ui-avatars.com/api/?name=${authUser?.fullName || 'User'}&background=1e3a8a&color=fff&size=128`}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-blue-400"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              />
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6 max-w-md mx-auto">
              <div className="bg-gray-700 rounded-lg p-4 transition-all hover:bg-gray-600">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">Full Name</span>
                </div>
                <div className="mt-2 pl-8 text-gray-300">
                  {authUser?.fullName || 'User'}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 transition-all hover:bg-gray-600">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">Email</span>
                </div>
                <div className="mt-2 pl-8 text-gray-300">
                  {authUser?.email || 'user@example.com'}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 transition-all hover:bg-gray-600">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">Member Since</span>
                </div>
                <div className="mt-2 pl-8 text-gray-300">
                  {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;