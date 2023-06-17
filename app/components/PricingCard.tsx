import axios from "axios"
import {AiFillCheckCircle} from 'react-icons/ai'
import {HiOutlineArrowNarrowRight} from 'react-icons/hi'

const PricingCard = ({price, email, accessToken}) => {

const dynamicSubTitle = (price) => {
  if (price.unit_amount == "500") {
    return <p className="text-black mt-1">Basic Plan</p>;
  } else if (price.unit_amount == "2000") {
    return <p className="text-black mt-1">Pro Plan</p>;
  }
}

const dynamicDescription = (price) => {
  if (price.unit_amount == "500") {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex space-x-3">
          <AiFillCheckCircle
            className="h-5 w-5 flex-shrink-0 text-yellow-100 ml-2"
            aria-hidden="true"
          />
          <h2 className="text-sm text-white">
            Unlimited Generations
          </h2>
        </div>
        <div className="border" />
        <div className="flex space-x-3">
          <AiFillCheckCircle
            className="h-5 w-5 flex-shrink-0 text-yellow-100 ml-2"
            aria-hidden="true"
          />
          <h2 className="text-sm text-white">
            Basic Access to New Features
          </h2>
        </div>
        <div className="border" />
        <div className="flex space-x-3">
          <AiFillCheckCircle
            className="h-5 w-5 flex-shrink-0 text-yellow-100 ml-2"
            aria-hidden="true"
          />
          <h2 className="text-sm text-white">Pay Once a Month</h2>
        </div>
        <div className="border" />
      </div>
    );
  } else if (price.unit_amount == "2000") {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex space-x-3">
          <AiFillCheckCircle
            className="h-5 w-5 flex-shrink-0 text-yellow-100 ml-2"
            aria-hidden="true"
          />
          <p className="text-sm text-white">Unlimited Generations</p>
        </div>
        <div className="border" />
        <div className="flex space-x-3">
          <AiFillCheckCircle
            className="h-5 w-5 flex-shrink-0 text-yellow-100 ml-2"
            aria-hidden="true"
          />
          <p className="text-sm text-white">
            Priority Access to New Features
          </p>
        </div>
        <div className="border" />
        <div className="flex space-x-3">
          <AiFillCheckCircle
            className="h-5 w-5 flex-shrink-0 text-yellow-100 ml-2"
            aria-hidden="true"
          />
          <p className="text-sm text-white">Pay Once a Year</p>
        </div>
        <div className="border" />
      </div>
    );
  } 
};

// POST request 
const handleSubscription = async (e) => {
  const { data } = await axios.post('/api/payment',
  {
    priceId: price.id,
    email: email,
    accessToken: accessToken,
  },
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
  );
    window.location.assign(data);
}

  return (
    <div className="border border-white rounded-lg p-4 bg-white bg-opacity-60 text-center mt-10 max-w-[400px]">
       <div>
       <ul className="flex justify-center">
              <li className="text-3xl font-bold" >{dynamicSubTitle(price)}</li>
          </ul>
        <div>
          <div className="flex flex-col items-center justify-center pt-4">
          <h1 className="text-3xl">
            {(price.unit_amount / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD'
            })} <span className="text-sm font-normal">{price.unit_amount === 500 ? '/ month' : '/ year'}</span>
          </h1>
              <h3>{dynamicDescription(price)}</h3>
          </div>
          <div className="flex items-center justify-center">

          <button className="mt-8 flex justify-center align-middle rounded-md border border-transparent bg-orange-400 py-2 px-3 text-sm font-medium text-white shadow-sm" onClick={(e) => handleSubscription(e)}>
             Subscribe
             <div className="ml-1.5 mt-1">
              <HiOutlineArrowNarrowRight/>
             </div>
          </button>
          </div>
        </div>
       </div>
    </div>
  )
}

export default PricingCard