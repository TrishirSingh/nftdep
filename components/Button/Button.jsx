import React from 'react'
import Style from './Button.module.css'

const Button = ({ btnName, handleClick, icon, classStyle }) => {
  return (
    <div className={Style.buttonBox}>
      <button 
        className={Style.button}
        onClick={(e) => handleClick && handleClick(e)}
      >
        {icon}
        {btnName}
      </button>
    </div>
  )
}

export default Button