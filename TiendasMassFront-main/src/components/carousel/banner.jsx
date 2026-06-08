// src/components/carousel/Banner.jsx
import React from 'react';
import './banner.css'; // Importa el archivo CSS para estilos
import banner1 from '../../assets/banner/BANNER-WEB.png';
import banner2 from '../../assets/banner/banner2.png';
import banner3 from '../../assets/banner/banner3.png';


const Banner = ( ) => {
  return (
    <div id="carouselExampleAutoplaying" className="carousel slide" data-bs-ride="carousel">

      <div className="carousel-inner">
        <div className="carousel-item active">
          <img src={banner1} className="d-block w-100" alt="banner1" />
        </div>
        <div className="carousel-item">
          <img src={banner2} className="d-block w-100" alt="banner2" />
        </div>
        <div className="carousel-item">
          <img src={banner3} className="d-block w-100" alt="banner3" />
        </div>
      </div>
      <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
};

export default Banner;
