"use client"
import React, { useEffect,Suspense } from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
  const router = useRouter();
  useEffect(()=>{
    const userUSN = localStorage.getItem('userUSN');
    if(userUSN){
      router.push('/dashboard');
    }else{
      router.push('/auth/user-login');
    }
  },[])
  return (
<Suspense fallback={<div>Loading...</div>}>
    <></>
</Suspense>
  )
}

export default page