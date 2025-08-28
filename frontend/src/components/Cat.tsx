import React from 'react'

type Props = { open: boolean; popClass?: string }

// ใช้รูป PNG ที่ให้มา และทำให้ responsive ใหญ่พอดีกับจอ
export default function Cat({ open, popClass = '' }: Props) {
  const src = open ? '/cat-open.png' : '/cat-close.png'
  return (
    <div className={`w-full flex justify-center ${popClass}`}>
      <img
        src={src}
        alt="popcat"
        draggable={false}
        className="w-[70vw] md:w-[48vw] lg:w-[40vw] xl:w-[34vw] 2xl:w-[30vw] max-w-[760px] min-w-[260px] h-auto mx-auto pointer-events-none select-none"
      />
    </div>
  )
}