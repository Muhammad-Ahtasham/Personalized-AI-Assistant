"use client";
import React, { useState, useRef, useEffect } from "react";
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const toggleSection = (sectionTitle: string) => {
    if (expandedSection === sectionTitle) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionTitle);
    }
  };

  // Parse the plan and set the first section as expanded by default
  const parsePlan = (planText: string): { title: string; sections: LearningPlanSection[] } => {
    const lines = planText.split('\n').filter(line => line.trim());
    
    // Extract title (usually the first line with ** or after "Personalized Learning Plan:")
    const titleMatch = planText.match(/\*\*(.*?)\*\*/);
    const planTitleMatch = planText.match(/Personalized Learning Plan:\s*(.*?)(?:\n|$)/i);
    const title = titleMatch ? titleMatch[1] : 
                 planTitleMatch ? planTitleMatch[1] : "Learning Plan";
    
    const sections: LearningPlanSection[] = [];
    let currentSection: LearningPlanSection | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and title
      if (!trimmedLine || trimmedLine.includes('Personalized Learning Plan:')) continue;
      
      // Check for section headers (### or **) - clean them up
      if (trimmedLine.startsWith('###') || (trimmedLine.startsWith('**') && trimmedLine.endsWith('**'))) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const sectionTitle = trimmedLine
          .replace(/^###\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        currentSection = {
          title: sectionTitle,
          content: [],
          type: getSectionType(sectionTitle)
        };
      } else if (currentSection && trimmedLine) {
        // Handle numbered lists, bullet points, and regular content - clean up markdown
        let cleanContent = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/###\s*/g, '') // Remove headers
          .replace(/##\s*/g, '') // Remove subheaders
          .replace(/#\s*/g, '') // Remove single headers
          .replace(/---/g, '') // Remove separators
          .trim();
        
        if (cleanContent.match(/^\d+\./)) {
          // Numbered list item
          currentSection.content.push(cleanContent);
        } else if (cleanContent.startsWith('-') || cleanContent.startsWith('*')) {
          // Bullet point
          currentSection.content.push(cleanContent);
        } else if (cleanContent.startsWith('*Resource*:') || cleanContent.startsWith('*Tip*:')) {
          // Resource or tip
          currentSection.content.push(cleanContent);
        } else if (cleanContent.includes('---')) {
          // Separator, skip
          continue;
        } else if (cleanContent.length > 0) {
          // Regular content
          currentSection.content.push(cleanContent);
        }
      } else if (!currentSection && trimmedLine) {
        // If no section is created yet, create a default one
        const cleanContent = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/###\s*/g, '')
          .replace(/##\s*/g, '')
          .replace(/#\s*/g, '')
          .replace(/---/g, '')
          .trim();
        
        currentSection = {
          title: "Overview",
          content: [cleanContent],
          type: 'general'
        };
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If no sections were found, create a default section with all content
    if (sections.length === 0) {
      const cleanLines = lines
        .filter(line => line.trim() && !line.includes('Personalized Learning Plan:'))
        .map(line => line
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/###\s*/g, '')
          .replace(/##\s*/g, '')
          .replace(/#\s*/g, '')
          .replace(/---/g, '')
          .trim()
        );
      
      sections.push({
        title: "Learning Plan",
        content: cleanLines,
        type: 'general'
      });
    }
    
    return { title, sections };
  };

  // Set the first section as expanded by default when plan changes
  useEffect(() => {
    if (plan && !isInitialized) {
      const { sections } = parsePlan(plan);
      if (sections.length > 0) {
        setExpandedSection(sections[0].title);
        setIsInitialized(true);
      }
    }
  }, [plan, isInitialized]);

  // Scroll to the newly opened section
  useEffect(() => {
    if (expandedSection && sectionRefs.current[expandedSection]) {
      const element = sectionRefs.current[expandedSection];
      if (element) {
        // Add a small delay to ensure the accordion animation has started
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }, 100);
      }
    }
  }, [expandedSection]);

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
        return <CheckCircleIcon className="w-5 h-5 text-blue-400" />;
      case 'steps':
        return <AcademicCapIcon className="w-5 h-5 text-green-accent" />;
      case 'resources':
        return <LinkIcon className="w-5 h-5 text-purple-400" />;
      case 'tips':
        return <LightBulbIcon className="w-5 h-5 text-yellow-400" />;
      default:
        return <BookOpenIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSectionColor = (type: LearningPlanSection['type']) => {
    switch (type) {
      case 'prerequisites':
        return 'border-blue-500/20 bg-blue-500/10';
      case 'steps':
        return 'border-yellow-accent/20 bg-yellow-accent/10';
      case 'resources':
        return 'border-purple-500/20 bg-purple-500/10';
      case 'tips':
        return 'border-yellow-500/20 bg-yellow-500/10';
      default:
        return 'border-border bg-muted';
    }
  };

  const { title, sections } = parsePlan(plan);

  return (
    <div className="space-y-6">
      {/* Main Title Card */}
      <div className="bg-yellow-accent/10 border border-yellow-accent/20 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-yellow-accent/20 rounded-lg">
            <BookOpenIcon className="w-6 h-6 text-yellow-accent" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-accent">{title}</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Follow this step-by-step guide to master the fundamentals and build your skills.
        </p>
      </div>

      {/* Fallback for unstructured content */}
      {sections.length === 0 && (
        <div className="card-dark">
          <div className="whitespace-pre-line text-foreground leading-relaxed">{plan}</div>
        </div>
      )}

      {/* Sections */}
      {sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((section, index) => (
          <div
            key={index}
            ref={(el) => { sectionRefs.current[section.title] = el; }}
            className={`border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${getSectionColor(section.type)}`}
          >
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-muted rounded-lg">
                  {getSectionIcon(section.type)}
                </div>
                <h3 className="font-semibold text-lg text-white">{section.title}</h3>
              </div>
              {expandedSection === section.title ? (
                <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {expandedSection === section.title && (
              <div className="px-4 pb-4 border-t border-border/50">
                <div className="pt-4 space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex} className="text-foreground leading-relaxed">
                      {item.startsWith('*Resource*:') || item.startsWith('*Tip*:') ? (
                        <div className="bg-muted rounded-lg p-3 border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            {item.startsWith('*Resource*:') ? (
                              <LinkIcon className="w-4 h-4 text-purple-400" />
                            ) : (
                              <LightBulbIcon className="w-4 h-4 text-yellow-400" />
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
                            <span className="flex-shrink-0 w-6 h-6 bg-yellow-accent/20 text-yellow-accent text-sm font-medium rounded-full flex items-center justify-center mt-0.5">
                              {item.match(/^\d+\./)?.[0]?.replace('.', '')}
                            </span>
                          ) : item.startsWith('-') || item.startsWith('*') ? (
                            <span className="flex-shrink-0 w-2 h-2 bg-yellow-accent rounded-full mt-2" />
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