"use client";

import { useBillCreation } from "@/hooks/cashier/useBillCreation";
import { billFormSchema } from "@/lib/schemas/bill";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PhoneInput,
} from "@reelo/ui/components";
import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCashierContext } from "../_context/CashierContext";

export function BillCreationForm() {
  const { business } = useCashierContext();
  const {
    selectedCustomer,
    searchResults,
    isSearching,
    searchCustomers,
    handleCustomerSelect,
    clearSelectedCustomer,
    createBill,
    isCreating,
    createError,
    createSuccess,
    resetMutation,
  } = useBillCreation(business.id);

  const [billNumber, setBillNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phoneNumber.length >= 4) {
      searchCustomers(phoneNumber);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [phoneNumber, searchCustomers]);

  useEffect(() => {
    if (selectedCustomer) {
      setName(selectedCustomer.name || "");
      setEmail(selectedCustomer.email || "");
      setAddressLine1(selectedCustomer.addressLine1 || "");
      setAddressLine2(selectedCustomer.addressLine2 || "");
      setCity(selectedCustomer.city || "");
      setState(selectedCustomer.state || "");
      setCountry(selectedCustomer.country || "");
      setPostalCode(selectedCustomer.postalCode || "");
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (createSuccess) {
      toast.success("Bill created successfully!");
      handleReset();
      resetMutation();
    }
  }, [createSuccess, resetMutation]);

  useEffect(() => {
    if (createError) {
      const errorMsg = getErrorMessageFromResponse(
        createError,
        "Failed to create bill. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }, [createError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        phoneInputRef.current &&
        !phoneInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleReset = () => {
    setBillNumber("");
    setPhoneNumber("");
    setName("");
    setEmail("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setCountry("");
    setPostalCode("");
    setAmount("");
    clearSelectedCustomer();
    setError(null);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const validationResult = billFormSchema.safeParse({
        billNumber,
        phoneNumber,
        name: name || null,
        email: email || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postalCode: postalCode || null,
        amount: amount ? parseFloat(amount) : null,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        const errorMessage = firstError?.message || "Invalid input";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      await createBill(validationResult.data);
    } catch (err: any) {
      const errorMsg = getErrorMessageFromResponse(
        err,
        "An unexpected error occurred. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Create Bill</CardTitle>
        <CardDescription>
          Enter bill details and customer information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 rounded-lg border p-3 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number *</Label>
              <Input
                id="billNumber"
                placeholder="BILL-001"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                required
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="relative space-y-2">
            <Label htmlFor="phoneNumber">Customer Phone Number *</Label>
            <div className="relative" ref={phoneInputRef}>
              <PhoneInput
                id="phoneNumber"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(value: string) => {
                  setPhoneNumber(value.toString());
                  clearSelectedCustomer();
                }}
                required
                disabled={isCreating || !!selectedCustomer}
              />
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    clearSelectedCustomer();
                    setPhoneNumber("");
                  }}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 z-10 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showSuggestions && searchResults.length > 0 && (
              <div
                ref={suggestionsRef}
                className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-md"
              >
                {searchResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      handleCustomerSelect(customer);
                      setShowSuggestions(false);
                    }}
                    className="hover:bg-accent focus:bg-accent w-full px-4 py-2 text-left focus:outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {customer.phoneNumber}
                        </div>
                      </div>
                      {customer.isBusinessCustomer && (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                          This Business
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isSearching && (
              <p className="text-muted-foreground text-sm">Searching...</p>
            )}
            {selectedCustomer && (
              <div className="bg-primary/10 border-primary/20 text-primary flex items-center gap-2 rounded-lg border p-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Selected: {selectedCustomer.name} (
                  {selectedCustomer.phoneNumber})
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Customer Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              placeholder="123 Main Street"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              placeholder="Apt 4B"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                placeholder="400001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              loading={isCreating}
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Bill"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isCreating}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
