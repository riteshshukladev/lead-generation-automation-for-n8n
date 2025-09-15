import React from "react";
import FormatGrid from "./FormatGrid";
import StartEmailScrapping from "./StartEmailScrapping";
import SheetLink from "./SheetLink";
import MailFormatGrid from "./MailFormat";
import StartEmailSending from "./StartEmailSending";
import SmsResult from "./SmsResult";

const GridLayout = () => {
  return (
    <div
      className="
        flex flex-col w-full
        md:grid md:h-screen
        md:grid-rows-[repeat(3,minmax(0,1fr))] md:grid-cols-2
        lg:grid-rows-[repeat(2,minmax(0,1fr))] lg:grid-cols-3
        md:divide-x md:divide-y md:divide-gray-300 md:w-full
      "
    >
      <FormatGrid />
      <StartEmailScrapping />
      <SheetLink />
      <MailFormatGrid />
      <StartEmailSending />
      <SmsResult/>      
    </div>
  );
};

export default GridLayout;
