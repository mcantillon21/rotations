import { useState, useEffect } from "react";
import axios from "axios";
import PricingCard from "./PricingCard";

const Paywall = ({ email, accessToken }) => {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    const { data } = await axios.get("/api/getproducts");
    setPrices(data);
    console.log(data);
  };

  return (
    <div className="w-full flex justify-center flex-col">
    <h1 className="text-white font-bold text-2xl flex justify-center mt-10 text-center">Sorry you ran out of credits! To continue using Rotation, subscribe to a plan below.</h1>
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[1040px] items-center">
          {prices &&
            prices.map((price) => (
              <PricingCard price={price} key={price.id} email={email} accessToken={accessToken} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Paywall;
