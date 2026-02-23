import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLayout } from "../../app/LayoutContext";
import { usePermissions } from "../../shared/permissions/UsePermissions";
import DateTimePicker from "../../shared/components/DateTimePicker";
import { supabase } from "../../lib/supabase";

/* =========================
   Parent Component
========================= */
export default function BookNow() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState({ wash: 0, dry: 0, fold: 0 });
  const [addons, setAddons] = useState({ detergent: 0, conditioner: 0 });
  const [weight, setWeight] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const { setHideBottomNav } = useLayout();
  const { requestLocationPermission } = usePermissions();
  const [collectionInfo, setCollectionInfo] = useState({
    option: "dropOffPickUpLater",
    optionLabel: "Drop-off & Pick up later",
    date: "",
    time: "09:00",
  });
  const [deliveryInfo, setDeliveryInfo] = useState({
    date: "",
    time: "09:00",
  });
  const prices = { wash: 60, dry: 65, fold: 30 };

  const steps = [
    "Select Services",
    "Collection & Delivery",
    "Address Details",
    "Review Booking",
  ];

  useEffect(() => {
    setHideBottomNav(step === 3);

    return () => {
      setHideBottomNav(false);
    };
  }, [step, setHideBottomNav]);

  useEffect(() => {
    if (
      collectionInfo.option !== "dropOffPickUpLater" &&
      paymentMethod === "cash"
    ) {
      setPaymentMethod("gcash");
    }
  }, [collectionInfo.option, paymentMethod]);

  const handleStepChange = (newStep) => {
    // Check if moving to step 3 (Address) and request location permission
    if (newStep === 3) {
      requestLocationPermission((granted) => {
        if (granted) {
          setStep(newStep);
        }
        // If not granted, just don't navigate to step 3
      });
    } else {
      setStep(newStep);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-3 md:px-2">
      {/* Stepper Container */}
      <div className="max-w-none lg:max-w-7xl mx-auto mb-4 pt-2 overflow-visible">
        <style>
          {`
            .steps .step:first-child::before {
              background-color: transparent !important;
            }
            .steps .step::before {
              background-color: var(--step-line-color, #b4b4b4);
            }
            .steps .step {
              color: var(--step-label-color, #b4b4b4);
            }
            .steps .step::after {
              background-color: var(--step-circle-color, #b4b4b4);
              border-color: var(--step-circle-color, #b4b4b4);
            }
            .date-input::-webkit-calendar-picker-indicator,
            .time-input::-webkit-calendar-picker-indicator {
              opacity: 0;
              position: absolute;
              right: 0.75rem;
              width: 1.5rem;
              height: 1.5rem;
              cursor: pointer;
            }
          `}
        </style>
        <ul className="steps w-full overflow-visible">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = step > stepNumber;
            const isCurrent = step === stepNumber;
            const circleColor = isCompleted || isCurrent ? "#3878c2" : "#b4b4b4";
            const lineColor = isCompleted || isCurrent ? "#3878c2" : "#b4b4b4";
            const labelColor = isCompleted || isCurrent ? "#3878c2" : "#b4b4b4";

            return (
              <li
                key={label}
                className="step"
                style={{
                  "--step-circle-color": circleColor,
                  "--step-line-color": lineColor,
                  "--step-label-color": labelColor,
                }}
              >
                <span className="font-semibold text-[0.6rem] sm:text-[0.65rem] md:text-xs">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Step Content */}
      <div className="max-w-none lg:max-w-7xl mx-auto px-0 sm:px-1">
        {step === 1 && (
          <StepSelectServices
            onNext={() => handleStepChange(2)}
            prices={prices}
            services={services}
            setServices={setServices}
            addons={addons}
            setAddons={setAddons}
            weight={weight}
            setWeight={setWeight}
            collectionInfo={collectionInfo}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        )}
        {step === 2 && (
          <StepCollection
            onBack={() => setStep(1)}
            onNext={() => handleStepChange(3)}
            collectionInfo={collectionInfo}
            setCollectionInfo={setCollectionInfo}
            deliveryInfo={deliveryInfo}
            setDeliveryInfo={setDeliveryInfo}
          />
        )}
        {step === 3 && (
          <StepAddress
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepReview
            onBack={() => setStep(3)}
            prices={prices}
            services={services}
            addons={addons}
            weight={weight}
            paymentMethod={paymentMethod}
            collectionInfo={collectionInfo}
            deliveryInfo={deliveryInfo}
          />
        )}
      </div>
    </div>
  );
}

/* =========================
   Step 1 – Select Services
========================= */
function StepSelectServices({
  onNext,
  prices,
  services,
  setServices,
  addons,
  setAddons,
  weight,
  setWeight,
  collectionInfo,
  paymentMethod,
  setPaymentMethod,
}) {

  const toggleService = (key) => {
    setServices((prev) => ({ ...prev, [key]: prev[key] === 0 ? 1 : 0 }));
  };

  const ServiceCard = ({ title, price, value, onToggle }) => {
    const selected = value === 1;
    return (
      <div
        className="border rounded-lg p-4 transition"
        style={{
          borderColor: "#3878c2",
          backgroundColor: selected ? "rgba(99,188,230,0.1)" : "#ffffff",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-[#3878c2]">{title}</h3>
            <p className="text-xs text-[#3878c2]">₱{price} per load</p>
          </div>
          <button
            onClick={onToggle}
            className="flex items-center justify-center gap-1 px-3 py-1 border rounded text-sm font-semibold transition whitespace-nowrap"
            style={{
              borderColor: "#4bad40",
              backgroundColor: selected ? "#4bad40" : "transparent",
              color: selected ? "#ffffff" : "#4bad40",
            }}
          >
            {selected ? (
              <>
                <CheckIcon color="#ffffff" /> Added
              </>
            ) : (
              <>
                <PlusIcon color="#4bad40" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="px-0 sm:px-2">
      <h2 className="text-lg font-semibold text-[#3878c2] mb-4 sm:text-xl">
        Select Services
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ServiceCard
          title="Wash"
          price={prices.wash}
          value={services.wash}
          onToggle={() => toggleService("wash")}
        />
        <ServiceCard
          title="Dry"
          price={prices.dry}
          value={services.dry}
          onToggle={() => toggleService("dry")}
        />
        <ServiceCard
          title="Fold"
          price={prices.fold}
          value={services.fold}
          onToggle={() => toggleService("fold")}
        />
      </div>

      {/* Add-Ons */}
      <h3 className="text-sm font-semibold text-[#3878c2] mt-6 mb-2">
        Add-Ons
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-1">
          <AddonRow
            label="Detergent"
            value={addons.detergent}
            onChange={(v) =>
              setAddons((prev) => ({ ...prev, detergent: Math.max(0, Math.floor(v)) }))
            }
            allowDecimal={false} // integers only
          />

          <AddonRow
            label="Fabric Conditioner"
            value={addons.conditioner}
            onChange={(v) =>
              setAddons((prev) => ({ ...prev, conditioner: Math.max(0, Math.floor(v)) }))
            }
            allowDecimal={false} // integers only
          />
        </div>

        {/* Laundry Weight */}
        <div className="flex items-start justify-between gap-2 mb-3 lg:col-span-1">
          <span className="text-sm font-semibold text-[#3878c2] max-w-[60%] pr-2">
            Laundry Weight
            <br />
            (in kg)
          </span>
          <QuantityInput
            value={weight}
            onChange={setWeight}
            allowDecimal={true} // allow 1 decimal
          />
        </div>
      </div>

      {/* Payment Method */}
      <h3 className="text-sm font-semibold text-[#3878c2] mt-6 mb-2">
        Payment Method
      </h3>

      <div className="space-y-2 max-w-md text-[#3878c2]">
        <RadioRow
          id="payment-gcash"
          label="GCash"
          checked={paymentMethod === "gcash"}
          onChange={() => setPaymentMethod("gcash")}
          name="paymentMethod"
        />
        <RadioRow
          id="payment-cash"
          label="Cash"
          checked={paymentMethod === "cash"}
          onChange={() => setPaymentMethod("cash")}
          disabled={collectionInfo.option !== "dropOffPickUpLater"}
          name="paymentMethod"
        />
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        className="mt-8 mx-auto block w-40 py-2 rounded text-white font-semibold"
        style={{ backgroundColor: "#4bad40" }}
      >
        Next
      </button>
      </div>
    </>
  );
}


/* =========================
   Reusable Components
========================= */
function QuantityInput({ value, onChange, allowDecimal }) {
  const handleChange = (e) => {
    let val = e.target.value;

    // Allow empty input
    if (val === "") {
      onChange("");
      return;
    }

    // Allow only numbers (and 1 decimal if allowDecimal)
    const regex = allowDecimal ? /^(\d+\.?\d{0,1})?$/ : /^\d*$/;
    if (!regex.test(val)) return;

    // Remove leading zero if user types a non-zero number
    if (!allowDecimal && val.length > 1 && val.startsWith("0")) {
      val = val.replace(/^0+/, "");
    }

    onChange(val);
  };

  const handleBlur = () => {
    let num = parseFloat(value);
    if (isNaN(num) || num < 0) num = 0;

    if (allowDecimal) {
      num = Math.round(num * 10) / 10;
    } else {
      num = Math.floor(num);
    }

    onChange(num);
  };

  const handleIncrement = () => {
    let num = parseFloat(value) || 0;
    num += 1;
    if (allowDecimal) num = Math.ceil(num * 10) / 10;
    onChange(num);
  };

  const handleDecrement = () => {
    let num = parseFloat(value) || 0;
    num -= 1;
    if (num < 0) num = 0;
    if (allowDecimal) num = Math.floor(num * 10) / 10;
    onChange(num);
  };

  return (
    <div className="flex items-center max-w-[8rem]">
      <button
        onClick={handleDecrement}
        disabled={parseFloat(value) <= 0 || value === ""}
        className={`px-3 h-10 border rounded-l ${
          parseFloat(value) <= 0 || value === "" ? "opacity-40 cursor-not-allowed" : ""
        }`}
        style={{ borderColor: "#3878c2", color: "#3878c2" }}
      >
        −
      </button>

      <input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        type="text"
        className="w-full h-10 text-center border-y outline-none"
        style={{ borderColor: "#3878c2", color: "#3878c2" }}
      />

      <button
        onClick={handleIncrement}
        className="px-3 h-10 border rounded-r"
        style={{ borderColor: "#3878c2", color: "#3878c2" }}
      >
        +
      </button>
    </div>
  );
}

function AddonRow({ label, value, onChange, allowDecimal }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <span className="text-sm text-[#3878c2] max-w-[60%] pr-2">{label}</span>
      <QuantityInput
        value={value}
        onChange={onChange}
        allowDecimal={allowDecimal}
      />
    </div>
  );
}

/* =========================
   Icons
========================= */
function PlusIcon({ color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke={color}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CheckIcon({ color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke={color}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function StepCollection({
  onBack,
  onNext,
  collectionInfo,
  setCollectionInfo,
  deliveryInfo,
  setDeliveryInfo,
}) {
  const optionLabels = {
    dropOffPickUpLater: "Drop-off & Pick up later",
    dropOffDelivered: "Drop-off & Delivered",
    pickedUpDelivered: "Picked up & Delivered",
  };
  const option = collectionInfo.option || "dropOffPickUpLater";
  const optionLabel = optionLabels[option] || optionLabels.dropOffPickUpLater;

  useEffect(() => {
    if (collectionInfo.optionLabel !== optionLabel) {
      setCollectionInfo((prev) => ({ ...prev, optionLabel }));
    }
  }, [collectionInfo.optionLabel, optionLabel, setCollectionInfo]);

  // Autofill texts based on selected option
  const autofill = {
    dropOffPickUpLater: {
      collection: "I'll drop off my laundry",
      delivery: "I'll pick up my laundry",
    },
    dropOffDelivered: {
      collection: "I'll drop off my laundry",
      delivery: "Deliver my laundry to me",
    },
    pickedUpDelivered: {
      collection: "Pick up my laundry from me",
      delivery: "Deliver my laundry to me",
    },
  };

  return (
    <div className="text-[#3878c2] space-y-6 px-0 sm:px-2">
      {/* Title */}
      <h2 className="text-lg font-semibold">Collection & Delivery</h2>

      {/* Options */}
      <div className="space-y-2">
        <RadioRow
          id="option1"
          label="Drop-off & Pick up later"
          checked={option === "dropOffPickUpLater"}
          onChange={() =>
            setCollectionInfo((prev) => ({
              ...prev,
              option: "dropOffPickUpLater",
              optionLabel: optionLabels.dropOffPickUpLater,
            }))
          }
        />
        <RadioRow
          id="option2"
          label="Drop-off & Delivered"
          checked={option === "dropOffDelivered"}
          onChange={() =>
            setCollectionInfo((prev) => ({
              ...prev,
              option: "dropOffDelivered",
              optionLabel: optionLabels.dropOffDelivered,
            }))
          }
        />
        <RadioRow
          id="option3"
          label="Picked up & Delivered"
          checked={option === "pickedUpDelivered"}
          onChange={() =>
            setCollectionInfo((prev) => ({
              ...prev,
              option: "pickedUpDelivered",
              optionLabel: optionLabels.pickedUpDelivered,
            }))
          }
        />
      </div>

      {/* Divider */}
      <hr className="border-t-1 border-[#3878c2] w-11/12 mx-auto md:hidden" />

      {/* Collection Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold text-[#3878c2]">Collection</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Preferred Date</label>
            <DateTimePicker
              mode="date"
              value={collectionInfo.date}
              onChange={(date) =>
                setCollectionInfo((prev) => ({ ...prev, date }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Preferred Time</label>
            <DateTimePicker
              mode="time"
              value={collectionInfo.time}
              onChange={(time) =>
                setCollectionInfo((prev) => ({ ...prev, time }))
              }
              min="09:00"
              max="18:00"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={autofill[option].collection}
              readOnly
              className="w-full p-2.5 rounded border border-default-medium text-[#3878c2] bg-neutral-secondary-medium"
            />
          </div>
        </div>
        <hr className="border-t-1 border-[#3878c2] w-11/12 mx-auto md:hidden" />
        <div className="space-y-3">
          <h3 className="font-semibold text-[#3878c2]">Delivery</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Preferred Date</label>
            <DateTimePicker
              mode="date"
              value={deliveryInfo.date}
              onChange={(date) =>
                setDeliveryInfo((prev) => ({ ...prev, date }))
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Preferred Time</label>
            <DateTimePicker
              mode="time"
              value={deliveryInfo.time}
              onChange={(time) =>
                setDeliveryInfo((prev) => ({ ...prev, time }))
              }
              min="09:00"
              max="18:00"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={autofill[option].delivery}
              readOnly
              className="w-full p-2.5 rounded border border-default-medium text-[#3878c2] bg-neutral-secondary-medium"
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-[#4bad40] rounded text-[#4bad40] bg-white"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded text-white bg-[#4bad40]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* =========================
   Option Row
========================= */
function RadioRow({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  name = "radioGroup",
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center p-2 rounded select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${
        checked ? "bg-[#e6f7e6]" : "bg-white"
      }`}
    >
      <span className="relative w-4 h-4 flex-shrink-0 mr-2">
        {/* Outer thin border */}
        <span
          className={`absolute inset-0 rounded-full border border-[#3878c2] bg-white`}
        ></span>
        {/* Inner shaded circle when checked */}
        {checked && (
          <span className="absolute top-1 left-1 w-2 h-2 bg-[#3878c2] rounded-full"></span>
        )}
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          onChange={!disabled ? onChange : undefined}
          disabled={disabled}
          className={`absolute w-full h-full opacity-0 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

/* =========================
   Placeholder Steps
========================= */
function StepAddress({ onBack, onNext }) {
  return (
    <div className="relative min-h-[70vh] sm:min-h-[72vh] bg-[#ffffff] text-[#3878c2] pb-24 sm:pb-28 px-0 sm:px-2">

      <form className="absolute top-2 left-0 right-0 z-20 mx-auto max-w-2xl md:max-w-6xl lg:max-w-7xl px-0 sm:px-1">
        <label htmlFor="simple-search" className="sr-only">
          Search
        </label>
        <div className="flex items-center gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3878c2]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-[#3878c2]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>

          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              id="simple-search"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#3878c2] bg-white text-[#3878c2] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-[#3878c2] focus:border-[#3878c2]"
              placeholder="Find your address"
              required
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3878c2]"
            aria-label="Search"
          >
            <svg
              className="h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
              />
            </svg>
          </button>
        </div>

      </form>

      <div className="relative min-h-[40vh] sm:min-h-[52vh] bg-[#ffffff]">
        <div className="absolute inset-0" aria-hidden="true"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-8 text-[#4bad40]"
          >
            <path
              fillRule="evenodd"
              d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div
        className="dock dock-xl absolute bottom-0 left-0 right-0 w-full px-0 pb-4 sm:px-2"
        style={{ backgroundColor: "#63bce6" }}
      >
        <div className="mx-auto max-w-2xl md:max-w-6xl lg:max-w-7xl pb-3 pt-4">
          <button
            onClick={onNext}
            className="w-full py-3 rounded-lg bg-[#ffffff] text-[#3878c2] font-semibold"
          >
            Choose this location
          </button>
        </div>
      </div>
    </div>
  );
}

function StepReview({
  onBack,
  services = { wash: 0, dry: 0, fold: 0 },
  addons = { detergent: 0, conditioner: 0 },
  weight = 0,
  prices = { wash: 60, dry: 65, fold: 30 },
  paymentMethod = "gcash",
  collectionInfo = { optionLabel: "-", date: "", time: "" },
  deliveryInfo = { date: "", time: "" },
}) {
  const navigate = useNavigate();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("success");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `HL-${timestamp}-${randomPart}`;
  };

  const formatBookingDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(/\s/g, " ");

  const getRouteAddresses = (option) => {
    if (option === "pickedUpDelivered") {
      return {
        pickupAddress: "Customer address (pickup)",
        deliveryAddress: "Customer address (delivery)",
      };
    }

    if (option === "dropOffDelivered") {
      return {
        pickupAddress: "Herland Laundry - Main Branch",
        deliveryAddress: "Customer address (delivery)",
      };
    }

    return {
      pickupAddress: "Herland Laundry - Main Branch",
      deliveryAddress: "Herland Laundry - Main Branch",
    };
  };


  // Helper to format Add-Ons quantities
  const formatAddonQuantity = (key, value) => {
    if (key === "detergent" || key === "conditioner") {
      return value * 2; // 2pcs per bundle
    }
    return value;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "-";
    const today = new Date();
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("default", { month: "long" });
    return today.toDateString() === d.toDateString()
      ? `Today | ${month} ${day}, ${d.getFullYear()}`
      : `${month} ${day}, ${d.getFullYear()}`;
  };

  // Format time to 12-hour
  const formatTime = (time) => {
    if (!time) return "-";
    const [hourStr, min] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
  };

  return (
    <div className="text-[#3878c2] bg-[#ffffff] min-h-screen px-0 py-4 sm:px-2">
      <h2 className="text-lg font-semibold mb-2 sm:text-xl">Review Booking</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Services Selected */}
        <div className="p-4 border rounded bg-[#ffffff] shadow-sm">
          <h3 className="font-semibold mb-2">Services Selected</h3>
          <ul className="list-disc list-inside text-sm">
            {services.wash ? <li>Wash (₱{prices.wash} per load)</li> : null}
            {services.dry ? <li>Dry (₱{prices.dry} per load)</li> : null}
            {services.fold ? <li>Fold (₱{prices.fold} per load)</li> : null}
            {!services.wash && !services.dry && !services.fold && <li>None</li>}
          </ul>

          {/* Add-Ons */}
          <h4 className="font-semibold mt-4 mb-1">Add-Ons</h4>
          {(addons.detergent || addons.conditioner) ? (
            <ul className="list-disc list-inside text-sm">
              {addons.detergent ? (
                <li>
                  Detergent: {formatAddonQuantity("detergent", addons.detergent)} pcs
                </li>
              ) : null}
              {addons.conditioner ? (
                <li>
                  Fabric Conditioner: {" "}
                  {formatAddonQuantity("conditioner", addons.conditioner)} pcs
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="text-sm">None</div>
          )}

          {/* Laundry Weight */}
          <h4 className="font-semibold mt-4 mb-1">
            Laundry Weight: {weight || 0}kg
          </h4>
        </div>

        {/* Collection & Delivery */}
        <div className="p-4 border rounded bg-[#ffffff] shadow-sm">
          <h3 className="font-semibold mb-4">Collection & Delivery</h3>
          <div className="text-s mb-3">
            <span className="font-medium">Mode:</span> {collectionInfo.optionLabel || "-"}
          </div>

          {/* Collection */}
          <div className="mb-3">
            <div className="text-s font-semibold text-[#3878c2] mb-1">
              Collection
            </div>
            <div className="flex items-center gap-2 mb-1 text-sm">
              <CalendarIcon />
              <span>{formatDate(collectionInfo.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon />
              <span>{formatTime(collectionInfo.time)}</span>
            </div>
          </div>

          <hr className="border-t border-[#3878c2] my-3" />

          {/* Delivery */}
          <div className="mb-3">
            <div className="text-s font-semibold text-[#3878c2] mb-1">
              Delivery
            </div>
            <div className="flex items-center gap-2 mb-1 text-sm">
              <CalendarIcon />
              <span>{formatDate(deliveryInfo.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon />
              <span>{formatTime(deliveryInfo.time)}</span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="p-4 border rounded bg-[#ffffff] shadow-sm md:col-span-2">
          <h3 className="font-semibold mb-2">Special Instructions</h3>
          <textarea
            placeholder="Notes or requests for your laundry"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full p-2 border rounded text-[#b4b4b4] placeholder-[#b4b4b4] focus:outline-none focus:ring-1 focus:ring-[#3878c2]"
            rows={3}
          />
        </div>
      </div>


      {/* Buttons */}
      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border-[0.5px] border-[#4bad40] rounded text-[#4bad40] bg-[#ffffff]"
        >
          Back
        </button>
        <button
          onClick={async () => {
            const nextReference = generateReferenceNumber();
            const nextPaymentReference = "";

            // Build the booking payload
            const selectedServices = Object.entries(services)
              .filter(([, isSelected]) => Boolean(isSelected))
              .map(([serviceName]) => serviceName);

            const selectedAddons = Object.entries(addons)
              .filter(([, quantity]) => Number(quantity) > 0)
              .map(([addonName, quantity]) => ({ name: addonName, quantity }));

            const routeAddresses = getRouteAddresses(collectionInfo.option);

            const payload = {
              reference_number: nextReference,
              collection_option: collectionInfo.option || "dropOffPickUpLater",
              service_details: {
                services,
                selectedServices,
                addons,
                selectedAddons,
                weight,
              },
              collection_details: {
                option: collectionInfo.option || "dropOffPickUpLater",
                optionLabel: collectionInfo.optionLabel || "Drop-off & Pick up later",
                collectionDate: collectionInfo.date || "",
                collectionTime: collectionInfo.time || "",
                deliveryDate: deliveryInfo.date || "",
                deliveryTime: deliveryInfo.time || "",
                pickupAddress: routeAddresses.pickupAddress,
                deliveryAddress: routeAddresses.deliveryAddress,
              },
              payment_details: {
                method: paymentMethod === "gcash" ? "GCash" : "Cash",
                referenceNumber: paymentMethod === "gcash" ? "" : "-",
                status: paymentMethod === "gcash" ? "For confirmation" : "Pay on collection",
              },
              notes: notes || "",
            };

            try {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              const response = await fetch("http://localhost:5000/api/v1/customer/book", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                const result = await response.json();
                const ref = result.booking?.reference_number || nextReference;
                 setBookingStatus("success");
                 setReferenceNumber(ref);
                 setPaymentReference(nextPaymentReference);
               } else {
                const errData = await response.json().catch(() => ({}));
                console.error("Booking failed:", errData.error || response.statusText);
                setBookingStatus("error");
                setReferenceNumber("");
                setPaymentReference("");
              }
            } catch (err) {
              console.error("Booking request error:", err);
              setBookingStatus("error");
              setReferenceNumber("");
              setPaymentReference("");
            }

            setIsSuccessOpen(true);
          }}
          className="px-4 py-2 rounded text-white bg-[#4bad40]"
        >
          Confirm Booking
        </button>
      </div>

      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center text-[#3878c2] shadow-lg">
            {bookingStatus === "success" ? (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7e6]">
                <svg
                  className="h-6 w-6 text-[#4bad40]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </div>
            ) : (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fde8e8]">
                <svg
                  className="h-6 w-6 text-[#e55353]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
            <h3 className="text-base font-semibold">
              {bookingStatus === "success"
                ? "Booking successful"
                : "Booking failed"}
            </h3>
            <p className="mt-1 text-sm text-[#3878c2]">
              {bookingStatus === "success"
                ? `Reference number: ${referenceNumber || "-"}`
                : "Please try again."}
            </p>
            {bookingStatus === "success" ? (
              <p className="mt-2 text-xs text-[#3878c2]">
                Our staff will provide your total amount. Kindly settle payment via GCash.
              </p>
            ) : null}
            <button
              onClick={() => {
                 if (bookingStatus === "success") {
                   navigate("/payment", {
                     state: {
                       bookingReference: referenceNumber,
                       paymentReference,
                       amountToPay: 0, // New bookings start with 0 amount to pay until admin sets it
                     },
                   });
                   return;
                 }
                setIsSuccessOpen(false);
              }}
              className="mt-4 w-full rounded-lg bg-[#4bad40] py-2 text-white"
            >
              {bookingStatus === "success" ? "Proceed to Payment" : "Try again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Icons
========================= */
function CalendarIcon() {
  return (
    <svg
      className="w-4 h-4 text-[#3878c2]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-4 h-4 text-[#3878c2]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
