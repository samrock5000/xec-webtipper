import React from 'react'

interface Props {}

const Header: React.FC<Props> = () => {
  return (
    <header style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      color: 'black',
      padding: '24px 44px',
      fontSize: '30px'
    }}>
      <div className="header-title">eCash<strong><sup> xec </sup></strong>webtipper</div>
    </header>
  )
}

export default Header
