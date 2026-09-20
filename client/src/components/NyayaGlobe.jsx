import React from "react";
import { Globe } from "./ui/globe";

export function NyayaGlobe() {
  const arcs = [
    { startLat: 19.0760, startLng: 72.8777, endLat: 28.6139, endLng: 77.2090, color: "#E8732A" }, // Mumbai -> Delhi
    { startLat: 12.9716, startLng: 77.5946, endLat: 22.5726, endLng: 88.3639, color: "#E8732A" }, // Bengaluru -> Kolkata
    { startLat: 13.0827, startLng: 80.2707, endLat: 17.3850, endLng: 78.4867, color: "#E8732A" }, // Chennai -> Hyderabad
    { startLat: 23.0225, startLng: 72.5714, endLat: 26.9124, endLng: 75.7873, color: "#E8732A" }, // Ahmedabad -> Jaipur
    { startLat: 28.6139, startLng: 77.2090, endLat: 12.9716, endLng: 77.5946, color: "#4ADE80" }, // Delhi -> Bengaluru
    { startLat: 19.0760, startLng: 72.8777, endLat: 13.0827, endLng: 80.2707, color: "#4ADE80" }, // Mumbai -> Chennai
  ];

  return (
    <div style={{ background: '#0A0A0A', overflow: 'hidden' }}>
      <div style={{ padding: '120px 0', maxWidth: '1200px', margin: '0 auto' }} className="flex flex-col lg:flex-row items-center gap-16 px-6 md:px-12">
        {/* Left Text Side */}
        <div style={{ flex: '1', zIndex: 10 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#E8732A', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Built for India
          </div>
          <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(40px, 5vw, 64px)', color: 'white', lineHeight: 1.05, marginBottom: '24px' }}>
            Every state.<br />
            Every language.<br />
            Every dispute.
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '440px', marginBottom: '40px' }}>
            Nyaya processes disputes in 8 Indian languages. Customers file in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, or Gujarati. Agents think in English. Verdicts come back in the customer's language.<br /><br />
            One platform. 1.4 billion potential users.
          </p>

          <div className="flex gap-10 flex-wrap">
            <div>
              <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: '36px', color: 'white' }}>8</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Indian languages</div>
            </div>
            <div>
              <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: '36px', color: 'white' }}>28</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>States covered</div>
            </div>
            <div>
              <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: '36px', color: 'white' }}>&lt; 10s</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>In any language</div>
            </div>
          </div>
        </div>

        {/* Right Globe Side */}
        <div style={{ flex: '1', width: '100%', height: '600px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '150%', height: '150%', position: 'absolute', right: '-25%', top: '-25%' }}>
            <Globe
              globeConfig={{
                pointSize: 1,
                globeColor: "#0A0A0A",
                showAtmosphere: true,
                atmosphereColor: "#E8732A",
                atmosphereAltitude: 0.1,
                polygonColor: "rgba(255,255,255,0.1)",
              }}
              data={arcs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
