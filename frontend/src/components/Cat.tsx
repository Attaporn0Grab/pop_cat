import React, { useState } from 'react'

type Props = { open: boolean; popClass?: string }

export default function Cat({ open, popClass = '' }: Props) {
  const [isMouseDown, setIsMouseDown] = useState(false)
  // ใช้ isMouseDown หรือ prop open อย่างใดอย่างหนึ่งในการตัดสินใจเปิดปาก
  const src = isMouseDown || open ? '/cat-open.png' : '/cat-close.png'

  return (
    <div 
      className={`w-full flex justify-center ${popClass}`}
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)} // กรณีเมาส์ออกนอกพื้นที่
    >
      <img
        src={src}
        alt="popcat"
        draggable={false}
        className="w-[70vw] md:w-[48vw] lg:w-[40vw] xl:w-[34vw] 2xl:w-[30vw] max-w-[760px] min-w-[260px] h-auto mx-auto pointer-events-none select-none"
      />
    </div>
  )
}