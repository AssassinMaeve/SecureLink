import UploadDocForm from "./UploadDocForm";
import Navbar from "./Navbar";
import "../style/HomePage.scss"; // Ensure this is correctly linked

const HomePage = () => {
  return (
    <div className="home-container">
      <Navbar />
      <div className="content">
        <div className="box">
          <h2>WELCOME TO SECURELINK</h2>
          <UploadDocForm />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
