import React, { useState } from 'react';
import { FiCreditCard, FiLock, FiX } from 'react-icons/fi';
import { API_URL } from '@/lib/utils/constants';
import { getCurrentUser } from '@/lib/utils/auth';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, course, onPaymentComplete }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear any error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple form validation
    if (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv) {
      setError('All fields are required');
      return;
    }

    // Credit card number validation (simple check for demo)
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Card number must be 16 digits');
      return;
    }

    // CVV validation
    if (formData.cvv.length < 3) {
      setError('Invalid CVV');
      return;
    }

    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      // For a real app, we would call the payment processing API
      // For this example, we'll simulate a successful payment and then directly call the enrollment API
      
      // First simulate payment processing with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now process actual enrollment - bypassing the payment API for demo
      // In a real app, you would call the payment API first and then enrollment
      const response = await fetch(`${API_URL}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: currentUser.id,
          courseId: course.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Payment successful! You're now enrolled in ${course.title}`);
        onPaymentComplete(); // This will redirect to the course content
      } else {
        throw new Error(data.message || 'Failed to process payment and enrollment');
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      console.error('Payment/enrollment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <FiX className="h-5 w-5" />
        </button>
        
        <div className="text-center mb-6">
          <FiCreditCard className="h-12 w-12 mx-auto text-blue-500 mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
          <p className="text-gray-600">
            Complete your purchase for <span className="font-semibold">{course.title}</span>
          </p>
          <div className="mt-2 font-bold text-lg">
            {parseFloat(course.price) === 0 ? 'Free' : `$${parseFloat(course.price).toFixed(2)}`}
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                id="cardName"
                name="cardName"
                type="text"
                value={formData.cardName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                value={formData.cardNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="text"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MM/YY"
                  maxLength="5"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  id="cvv"
                  name="cvv"
                  type="text"
                  value={formData.cvv}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123"
                  maxLength="4"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FiLock className="mr-2" /> Pay Now
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-xs text-center text-gray-500">
            <FiLock className="inline-block mr-1" /> 
            Your payment information is secure. We do not store your credit card details.
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal; 