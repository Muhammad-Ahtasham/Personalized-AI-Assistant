"use client";
import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, BookOpenIcon, CheckCircleIcon, AcademicCapIcon, LightBulbIcon, LinkIcon } from "@heroicons/react/24/outline";

interface LearningPlanSection {
  title: string;
  content: string[];
  type: 'prerequisites' | 'steps' | 'resources' | 'tips' | 'general';
}

interface LearningPlanDisplayProps {
  plan: string;
}

const LearningPlanDisplay: React.FC<LearningPlanDisplayProps> = ({ plan }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const parsePlan = (planText: string): { title: string; sections: LearningPlanSection[] } => {
    const lines = planText.split('\n').filter(line => line.trim());
    
    // Extract title (usually the first line with **)
    const titleMatch = planText.match(/\*\*(.*?)\*\*/);
    const title = titleMatch ? titleMatch[1] : "Learning Plan";
    
    const sections: LearningPlanSection[] = [];
    let currentSection: LearningPlanSection | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and title
      if (!trimmedLine || trimmedLine.includes('**Personalized Learning Plan:')) continue;
      
      // Check for section headers (### or **)
      if (trimmedLine.startsWith('###') || (trimmedLine.startsWith('**') && trimmedLine.endsWith('**'))) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const sectionTitle = trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, '').trim();
        currentSection = {
          title: sectionTitle,
          content: [],
          type: getSectionType(sectionTitle)
        };
      } else if (currentSection && trimmedLine) {
        // Handle numbered lists, bullet points, and regular content
        if (trimmedLine.match(/^\d+\./)) {
          // Numbered list item
          currentSection.content.push(trimmedLine);
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          // Bullet point
          currentSection.content.push(trimmedLine);
        } else if (trimmedLine.startsWith('*Resource*:') || trimmedLine.startsWith('*Tip*:')) {
          // Resource or tip
          currentSection.content.push(trimmedLine);
        } else if (trimmedLine.includes('---')) {
          // Separator, skip
          continue;
        } else {
          // Regular content
          currentSection.content.push(trimmedLine);
        }
      } else if (!currentSection && trimmedLine) {
        // If no section is created yet, create a default one
        currentSection = {
          title: "Overview",
          content: [trimmedLine],
          type: 'general'
        };
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If no sections were found, create a default section with all content
    if (sections.length === 0) {
      sections.push({
        title: "Learning Plan",
        content: lines.filter(line => line.trim() && !line.includes('**Personalized Learning Plan:')),
        type: 'general'
      });
    }
    
    return { title, sections };
  };

  const getSectionType = (title: string): LearningPlanSection['type'] => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('prerequisite')) return 'prerequisites';
    if (lowerTitle.includes('step') || lowerTitle.includes('guide')) return 'steps';
    if (lowerTitle.includes('resource') || lowerTitle.includes('link')) return 'resources';
    if (lowerTitle.includes('tip') || lowerTitle.includes('note')) return 'tips';
    return 'general';
  };

  const getSectionIcon = (type: LearningPlanSection['type']) => {
    switch (type) {
      case 'prerequisites':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'steps':
        return <AcademicCapIcon className="w-5 h-5 text-green-500" />;
      case 'resources':
        return <LinkIcon className="w-5 h-5 text-purple-500" />;
      case 'tips':
        return <LightBulbIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <BookOpenIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSectionColor = (type: LearningPlanSection['type']) => {
    switch (type) {
      case 'prerequisites':
        return 'border-blue-200 bg-blue-50/50';
      case 'steps':
        return 'border-green-200 bg-green-50/50';
      case 'resources':
        return 'border-purple-200 bg-purple-50/50';
      case 'tips':
        return 'border-yellow-200 bg-yellow-50/50';
      default:
        return 'border-gray-200 bg-gray-50/50';
    }
  };

  const { title, sections } = parsePlan(plan);

  return (
    <div className="space-y-6">
      {/* Main Title Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpenIcon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Follow this step-by-step guide to master the fundamentals and build your skills.
        </p>
      </div>

      {/* Fallback for unstructured content */}
      {sections.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="whitespace-pre-line text-foreground leading-relaxed">{plan}</div>
        </div>
      )}

      {/* Sections */}
      {sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((section, index) => (
          <div
            key={index}
            className={`border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${getSectionColor(section.type)}`}
          >
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/50 rounded-lg">
                  {getSectionIcon(section.type)}
                </div>
                <h3 className="font-semibold text-lg text-foreground">{section.title}</h3>
              </div>
              {expandedSections.has(section.title) ? (
                <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.has(section.title) && (
              <div className="px-4 pb-4 border-t border-border/50">
                <div className="pt-4 space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex} className="text-foreground leading-relaxed">
                      {item.startsWith('*Resource*:') || item.startsWith('*Tip*:') ? (
                        <div className="bg-white/70 rounded-lg p-3 border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            {item.startsWith('*Resource*:') ? (
                              <LinkIcon className="w-4 h-4 text-purple-500" />
                            ) : (
                              <LightBulbIcon className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm font-medium text-muted-foreground">
                              {item.startsWith('*Resource*:') ? 'Resource' : 'Tip'}:
                            </span>
                          </div>
                          <span className="text-foreground">{item.replace(/^\*(Resource|Tip)\*:\s*/, '')}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          {item.match(/^\d+\./) ? (
                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center justify-center mt-0.5">
                              {item.match(/^\d+\./)?.[0]?.replace('.', '')}
                            </span>
                          ) : item.startsWith('-') || item.startsWith('*') ? (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                          ) : null}
                          <span className="flex-1">{item.replace(/^[\d\-*\.\s]+/, '')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      )}


    </div>
  );
};

export default LearningPlanDisplay; 