// src/components/Login.jsx
import React from "react";
import { signInWithGoogle } from "../../firebase";

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="bg-bg-primary w-full min-h-screen flex flex-col  items-center text-center pt-16 md:pt-20 lg:pt-28 gap-8">
      {/* <h2>Please Sign In</h2>
      <button onClick={handleLogin}>Sign in with Google</button> */}
      <img src="" alt="" />
      <div className="text-block w-11/12 md:w-2/3 lg:max-w-8/12 flex flex-col items-center leading-[96%] gap-6">
        <h1 className="font-medium text-3xl md:text-4xl lg:text-5xl text-black">
          Automate leads generation and customize mail sending
        </h1>
        <p className="para w-4/5 text-center text-black/80">
          connect desired accounts and other services, generate leads, cusotmize
          mails based on types of leads and send them all at one place
        </p>
      </div>
      <button onClick={handleLogin} className="">
        Sign in with Google
      </button>
    </div>
  );
}
