import React from "react";
import {
  Building2,
  Users,
  Zap,
} from "lucide-react";
import SignalIcon from "@/components/SignalIcon";
import { QRCodeSVG } from "qrcode.react";

const features = [
  {
    icon: Building2,
    title: "Organisation Management",
    description:
      "Create and manage multiple organisations with subscription-based access control."
  },
  {
    icon: Users,
    title: "Student Registration",
    description:
      "Register students with RFID card IDs for seamless attendance tracking."
  },
  {
    icon: SignalIcon,
    title: "Blockchain Security",
    description:
      "All records are immutably stored on the Sui blockchain for transparency."
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    description:
      "Instant attendance recording with ESP32-powered RFID readers."
  }
];

export default React.memo(function LandingFeatures() {
  return (
    <section
      id="features"
      className="py-20 px-6 bg-[hsl(220,13%,9%)] overflow-hidden relative"
    >
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

        <div className="absolute bottom-0 left-1/4 w-72 h-72 -translate-y-1/4 -rotate-6">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={288}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute bottom-10 left-1/3 w-44 h-44 rotate-[18deg]">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={176}
            bgColor="transparent"
            fgColor="hsl(188, 94%, 43%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute bottom-5 left-1/2 w-64 h-64 -translate-x-1/2 rotate-8">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={256}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute bottom-10 right-10 w-56 h-56 rotate-[20deg]">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={224}
            bgColor="transparent"
            fgColor="hsl(188, 94%, 43%)"
            level="L"
            includeMargin={false}
          />
        </div>

        <div className="absolute bottom-1/4 right-0 w-52 h-52 translate-x-1/3 -rotate-[30deg]">
          <QRCodeSVG
            value="https://github.com/Arewa100/esp32_sui_attendance"
            size={208}
            bgColor="transparent"
            fgColor="hsl(217, 91%, 60%)"
            level="L"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(220,14%,96%)] mb-4">
            Everything you need
          </h2>
          <p className="text-base text-[hsl(220,9%,55%)] max-w-2xl">
            A complete solution for managing attendance with blockchain
            technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const topGridClass =
              index === 1
                ? "card-1-top"
                : index === 3
                ? "card-3-top"
                : "";
            const bottomGridClass =
              index === 0
                ? "card-0-bottom"
                : index === 2
                ? "card-2-bottom"
                : "";
            const descriptionClass = `card-${index}-description`;

            return (
              <div
                key={index}
                className="relative bg-[hsl(220,13%,9%)] border border-[hsl(220,13%,18%)] rounded-lg overflow-hidden group transition-all duration-300 flex flex-col"
                style={{ minHeight: "20em" }}
              >
                <div className="relative p-6 flex flex-col h-full">
                  <div className={`grid grid-cols-12 gap-px mb-3 ${topGridClass}`}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={`top-${i}`}
                        className={
                          topGridClass
                            ? `grid-box-animated grid-box-${i}`
                            : "h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors"
                        }
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mb-3 min-h-[60px]">
                    <div className="h-4 w-4 bg-blue-500 flex-shrink-0" />
                    <h3 className="text-base font-semibold text-[hsl(220,14%,96%)] whitespace-nowrap">
                      {feature.title}
                    </h3>
                  </div>

                  <div className="mb-4">
                    <p
                      className={`text-base text-[hsl(220,9%,55%)] leading-relaxed ${descriptionClass}`}
                    >
                      {feature.description}
                    </p>
                  </div>

                  <div className={`grid grid-cols-12 gap-px mt-auto ${bottomGridClass}`}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={`bottom-${i}`}
                        className={
                          bottomGridClass
                            ? `grid-box-animated grid-box-${i}`
                            : "h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

