import React, { useState } from 'react';
import { LearnerProfileKey, ProfileDefinition } from '../types';
import { PROFILE_DATA } from '../data';

interface RadarChartProps {
  data: {
    name: string;
    englishName: string;
    key: LearnerProfileKey;
    value: number;
    percentage: number;
    color: string;
    emoji: string;
  }[];
  maxSubmittedDays: number;
  title?: string;
  subtitle?: string;
}

export default function RadarChart({ data, maxSubmittedDays, title = '10대 학습자상 레이더', subtitle = '나의 다각적 역량 밸런스' }: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const size = 480;
  const center = size / 2;
  const maxRadius = 150; // Maximum radius for grid
  const totalSides = 10;

  // Scale value to a fraction of the maximum radius
  // If no submissions, prevent division by zero or full size
  const scaleMax = maxSubmittedDays > 0 ? maxSubmittedDays : 5;

  const getCoordinates = (index: number, val: number) => {
    // 10 sides, angle for each vertex. Offset by -PI/2 to start straight up.
    const angle = (2 * Math.PI / totalSides) * index - Math.PI / 2;
    const ratio = Math.min(val / scaleMax, 1); // Cap at 1
    const radius = ratio * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate background concentric rings (polygons)
  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => {
    const points: string[] = [];
    for (let i = 0; i < totalSides; i++) {
      const angle = (2 * Math.PI / totalSides) * i - Math.PI / 2;
      const x = center + (ratio * maxRadius) * Math.cos(angle);
      const y = center + (ratio * maxRadius) * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return {
      points: points.join(' '),
      label: `${Math.round(ratio * scaleMax)}회`,
      radius: ratio * maxRadius
    };
  });

  // Coordinates for the radiating web lines
  const webLines = Array.from({ length: totalSides }).map((_, i) => {
    const angle = (2 * Math.PI / totalSides) * i - Math.PI / 2;
    const endX = center + maxRadius * Math.cos(angle);
    const endY = center + maxRadius * Math.sin(angle);
    return { startX: center, startY: center, endX, endY };
  });

  // Coordinates for the completed data polygon
  const dataPoints = data.map((d, i) => getCoordinates(i, d.value));
  const dataPathString = dataPoints.length > 0
    ? dataPoints.map((p) => `${p.x},${p.y}`).join(' ')
    : '';

  // Calculate label offsets based on angle to prevent overlapping
  const getLabelAnchor = (angle: number) => {
    const cos = Math.cos(angle);
    if (Math.abs(cos) < 0.1) return 'middle';
    return cos > 0 ? 'start' : 'end';
  };

  const getLabelOffset = (angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      dx: cos * 24,
      dy: sin * 12 + (sin > 0 ? 10 : -4)
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="w-full max-w-[540px] aspect-[610/430] relative">
        <svg
          viewBox={`-65 45 ${size + 130} 430`}
          className="w-full h-full overflow-visible select-none"
        >
          {/* Gradients */}
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.55" />
            </radialGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Grid concentric polygons */}
          {gridRings.map((ring, idx) => (
            <polygon
              key={`ring-${idx}`}
              points={ring.points}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={idx === gridRings.length - 1 ? 'none' : '4 4'}
            />
          ))}

          {/* Grid ring labels (Y axis) */}
          {gridRings.map((ring, idx) => {
            if (idx === 0) return null; // skip center
            return (
              <text
                key={`ring-lbl-${idx}`}
                x={center}
                y={center - ring.radius + 12}
                className="text-[10px] font-medium text-slate-400"
                textAnchor="middle"
              >
                {ring.label}
              </text>
            );
          })}

          {/* Radial lines */}
          {webLines.map((line, idx) => (
            <line
              key={`line-${idx}`}
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}

          {/* The Data Polygon Area */}
          {dataPathString && (
            <polygon
              points={dataPathString}
              fill="url(#radarGrad)"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-in-out"
              filter="url(#shadow)"
            />
          )}

          {/* Data Points (Vertices) & Interactive Areas */}
          {dataPoints.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const item = data[idx];
            return (
              <g
                key={`pt-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Visual Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 5}
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                
                {/* Outer pulsing ring on hover */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={12}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ animationDuration: '1.5s' }}
                  />
                )}
              </g>
            );
          })}

          {/* Spoke Labels */}
          {data.map((item, idx) => {
            const angle = (2 * Math.PI / totalSides) * idx - Math.PI / 2;
            const tipX = center + (maxRadius + 15) * Math.cos(angle);
            const tipY = center + (maxRadius + 15) * Math.sin(angle);
            const anchor = getLabelAnchor(angle);
            const offset = getLabelOffset(angle);

            const isHovered = hoveredIndex === idx;

            return (
              <g key={`lbl-${idx}`} className="transition-all duration-200">
                <text
                  x={tipX + offset.dx}
                  y={tipY + offset.dy}
                  textAnchor={anchor}
                  className={`transition-all duration-150 ${isHovered ? 'scale-110 font-bold' : ''}`}
                >
                  <tspan className="text-[18px] sm:text-sm font-semibold fill-slate-700">
                    {item.emoji} {item.name}
                  </tspan>
                  <tspan
                    x={tipX + offset.dx}
                    dy="14"
                    textAnchor={anchor}
                    className="text-[12px] sm:text-[9px] fill-slate-400 font-mono"
                  >
                    {item.englishName} ({item.value}회)
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Information Overlay */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
          {hoveredIndex !== null ? (
            <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-md border border-slate-700 flex items-center space-x-2 animate-bounce">
              <span className="text-lg">{data[hoveredIndex].emoji}</span>
              <div>
                <span className="font-bold">{data[hoveredIndex].name}</span>: 
                <span className="ml-1 text-yellow-300 font-bold">{data[hoveredIndex].value}회 실천</span>
                <span className="ml-1 text-slate-300">({data[hoveredIndex].percentage}%)</span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-300 select-none">꼭짓점을 누르거나 마우스를 올리면 상세 기록이 보여요!</p>
          )}
        </div>
      </div>
    </div>
  );
}
