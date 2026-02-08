import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Package2, Phone, Mail, Lock, ChevronRight } from 'lucide-react';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email', 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let user;
            if (loginMethod === 'email') {
                user = await login(email, password);
            } else if (loginMethod === 'phone') {
                if (step === 1) {
                    setStep(2);
                    return;
                }
                user = await login('customer@example.com', 'password123');
            }

            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'rider') navigate('/rider');
            else navigate('/');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await googleLogin();
            if (result.newUser) {
                navigate('/register', { state: { googleInfo: result.googleInfo } });
                return;
            }
            if (result.role === 'admin') navigate('/admin');
            else if (result.role === 'rider') navigate('/rider');
            else navigate('/');
        } catch (err) {
            console.error('Google Login Error:', err);
            // Show more specific error message
            if (err.message?.includes('Firebase')) {
                setError('Firebase not configured. Please contact support.');
            } else if (err.message?.includes('popup was closed')) {
                setError('Sign-in cancelled');
            } else {
                setError(err.message || 'Google sign-in failed');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white sm:bg-gray-50">
            <div className="w-full max-w-md bg-white sm:rounded-[40px] sm:shadow-2xl sm:p-12 sm:border sm:border-gray-100 overflow-hidden">
                {/* Header / Brand */}
                <div className="p-8 pt-16 sm:p-0 flex flex-col items-center">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                        <Package2 className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-black">HBOX</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Premium Lunch Delivery</p>
                </div>

                <div className="flex-1 px-8 pb-12 sm:px-0 sm:pb-0 w-full">
                    <div className="mt-8 space-y-4">
                        <h2 className="text-2xl font-black tracking-tight mb-8 text-center sm:text-left">Ready for lunch?</h2>

                        <button
                            onClick={handleGoogleLogin}
                            className="uber-btn-white w-full !py-4 justify-center"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                            <span>Continue with Google</span>
                        </button>

                        <button
                            onClick={() => { setLoginMethod('phone'); setStep(1); }}
                            className="uber-btn-black w-full !py-4 justify-center"
                        >
                            <Phone className="w-5 h-5" />
                            <span>Continue with Phone</span>
                        </button>
                    </div>

                    <div className="relative py-10 flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">or</span>
                        <div className="flex-1 h-[1px] bg-gray-100"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {loginMethod === 'email' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        className="uber-input"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                                    <input
                                        type="password"
                                        className="uber-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                    {step === 1 ? 'Phone Number' : 'Enter OTP'}
                                </label>
                                <input
                                    type={step === 1 ? "tel" : "text"}
                                    className="uber-input text-center tracking-[0.2em]"
                                    placeholder={step === 1 ? "+91 XXXXX XXXXX" : "0 0 0 0"}
                                    value={step === 1 ? phone : otp}
                                    onChange={(e) => step === 1 ? setPhone(e.target.value) : setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {error && <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

                        <button type="submit" className="uber-btn-black w-full bg-blue-600 hover:bg-blue-500 border-none !py-4 justify-center">
                            <span>{loginMethod === 'phone' && step === 1 ? 'Next' : 'Login'}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 font-medium">
                            Don't have an account? <span className="text-black font-black cursor-pointer underline underline-offset-4" onClick={() => navigate('/register')}>Sign Up</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
