import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface LandingCTAProps {
  onGetStarted: () => void;
}

export default React.memo(function LandingCTA({ onGetStarted }: LandingCTAProps) {
  return (
    <section className="py-20 px-6 bg-[hsl(220,13%,9%)] overflow-hidden relative">
      {/* QR Code Background Pattern - Keeping all QR codes for aesthetic */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={256}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute top-10 left-1/4 w-48 h-48 rotate-[15deg]">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={192}
            bgColor="transparent"
            fgColor="hsl(188, 94%, 43%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute top-5 left-1/2 w-56 h-56 -translate-x-1/2 -rotate-12">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={224}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute top-1/4 right-0 w-96 h-96 translate-x-1/3 rotate-12">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={384}
            bgColor="transparent"
            fgColor="hsl(188, 94%, 43%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute top-1/2 left-0 w-52 h-52 -translate-x-1/4 -translate-y-1/2 rotate-6">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={208}
            bgColor="transparent"
            fgColor="hsl(188, 94%, 43%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-50">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={320}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute top-1/2 right-0 w-60 h-60 translate-x-1/4 -translate-y-1/2 -rotate-[25deg]">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={240}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[hsl(220,14%,96%)] mb-4">
          Ready to get started?
        </h2>
        <p className="text-lg text-[hsl(220,9%,55%)] mb-8">
          Connect your wallet and create your first organisation today.
        </p>
        <Button size="lg" variant="default" onClick={onGetStarted}>
          Launch Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
});

