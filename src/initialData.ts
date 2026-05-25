import type { GanttProject } from "./types";

export const INITIAL_MERMAID = `gantt
    title Residential House Build Schedule - Post Lock-Up
    dateFormat  YYYY-MM-DD
    axisFormat  Week %W

    section Internal Services
    Electrical Rough-In           :a1, 2026-05-25, 5d
    Plumbing Rough-In             :a2, after a1, 4d
    HVAC / Air Conditioning       :a3, after a1, 4d
    Data / Security / AV          :a4, after a1, 3d

    section Internal Linings
    Insulation                    :b1, after a2, 3d
    Wall & Ceiling Sheeting       :b2, after b1, 7d
    Waterproofing Wet Areas       :b3, after b2, 2d

    section Finishes
    Internal Waterproof Inspection :c1, after b3, 1d
    Tiling                        :c2, after c1, 7d
    Internal Painting             :c3, after b2, 8d
    Cabinetry / Joinery           :c4, after c2, 5d
    Benchtops                     :c5, after c4, 3d

    section Fit-Off
    Electrical Fit-Off            :d1, after c3, 4d
    Plumbing Fit-Off              :d2, after c4, 4d
    HVAC Commissioning            :d3, after d1, 2d
    Appliances Installation       :d4, after c5, 2d

    section Flooring & Doors
    Internal Doors & Hardware     :e1, after c3, 4d
    Flooring                      :e2, after c3, 5d
    Skirtings & Architraves       :e3, after e2, 4d

    section External Works
    Driveways & Paths             :f1, 2026-06-22, 5d
    Landscaping                   :f2, after f1, 5d
    Fencing & Gates               :f3, after f1, 4d

    section Finalisation
    Final Defect Rectification    :g1, after d4, 5d
    Final Cleaning                :g2, after g1, 2d
    Final Inspection              :g3, after g2, 1d
    Occupancy Certificate         :g4, after g3, 2d
    Handover                      :g5, after g4, 1d`;

export const DEFAULT_PROJECT: GanttProject = {
  title: "Residential House Build Schedule - Post Lock-Up",
  dateFormat: "YYYY-MM-DD",
  axisFormat: "Week %W",
  sections: [
    "Internal Services",
    "Internal Linings",
    "Finishes",
    "Fit-Off",
    "Flooring & Doors",
    "External Works",
    "Finalisation",
  ],
  tasks: [
    { id: "a1", name: "Electrical Rough-In", section: "Internal Services", startDate: "2026-05-25", durationDays: 5, dependencies: [], progress: 0 },
    { id: "a2", name: "Plumbing Rough-In", section: "Internal Services", durationDays: 4, dependencies: ["a1"], progress: 0 },
    { id: "a3", name: "HVAC / Air Conditioning", section: "Internal Services", durationDays: 4, dependencies: ["a1"], progress: 0 },
    { id: "a4", name: "Data / Security / AV", section: "Internal Services", durationDays: 3, dependencies: ["a1"], progress: 0 },
    { id: "b1", name: "Insulation", section: "Internal Linings", durationDays: 3, dependencies: ["a2"], progress: 0 },
    { id: "b2", name: "Wall & Ceiling Sheeting", section: "Internal Linings", durationDays: 7, dependencies: ["b1"], progress: 0 },
    { id: "b3", name: "Waterproofing Wet Areas", section: "Internal Linings", durationDays: 2, dependencies: ["b2"], progress: 0 },
    { id: "c1", name: "Internal Waterproof Inspection", section: "Finishes", durationDays: 1, dependencies: ["b3"], progress: 0 },
    { id: "c2", name: "Tiling", section: "Finishes", durationDays: 7, dependencies: ["c1"], progress: 0 },
    { id: "c3", name: "Internal Painting", section: "Finishes", durationDays: 8, dependencies: ["b2"], progress: 0 },
    { id: "c4", name: "Cabinetry / Joinery", section: "Finishes", durationDays: 5, dependencies: ["c2"], progress: 0 },
    { id: "c5", name: "Benchtops", section: "Finishes", durationDays: 3, dependencies: ["c4"], progress: 0 },
    { id: "d1", name: "Electrical Fit-Off", section: "Fit-Off", durationDays: 4, dependencies: ["c3"], progress: 0 },
    { id: "d2", name: "Plumbing Fit-Off", section: "Fit-Off", durationDays: 4, dependencies: ["c4"], progress: 0 },
    { id: "d3", name: "HVAC Commissioning", section: "Fit-Off", durationDays: 2, dependencies: ["d1"], progress: 0 },
    { id: "d4", name: "Appliances Installation", section: "Fit-Off", durationDays: 2, dependencies: ["c5"], progress: 0 },
    { id: "e1", name: "Internal Doors & Hardware", section: "Flooring & Doors", durationDays: 4, dependencies: ["c3"], progress: 0 },
    { id: "e2", name: "Flooring", section: "Flooring & Doors", durationDays: 5, dependencies: ["c3"], progress: 0 },
    { id: "e3", name: "Skirtings & Architraves", section: "Flooring & Doors", durationDays: 4, dependencies: ["e2"], progress: 0 },
    { id: "f1", name: "Driveways & Paths", section: "External Works", startDate: "2026-06-22", durationDays: 5, dependencies: [], progress: 0 },
    { id: "f2", name: "Landscaping", section: "External Works", durationDays: 5, dependencies: ["f1"], progress: 0 },
    { id: "f3", name: "Fencing & Gates", section: "External Works", durationDays: 4, dependencies: ["f1"], progress: 0 },
    { id: "g1", name: "Final Defect Rectification", section: "Finalisation", durationDays: 5, dependencies: ["d4"], progress: 0 },
    { id: "g2", name: "Final Cleaning", section: "Finalisation", durationDays: 2, dependencies: ["g1"], progress: 0 },
    { id: "g3", name: "Final Inspection", section: "Finalisation", durationDays: 1, dependencies: ["g2"], progress: 0 },
    { id: "g4", name: "Occupancy Certificate", section: "Finalisation", durationDays: 2, dependencies: ["g3"], progress: 0 },
    { id: "g5", name: "Handover", section: "Finalisation", durationDays: 1, dependencies: ["g4"], progress: 0 },
  ],
};
