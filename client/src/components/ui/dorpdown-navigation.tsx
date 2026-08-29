import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type NavItem = {
  id: number;
  label: string;
  subMenus?: {
    title: string;
    items: {
      label: string;
      description: string;
      icon: React.ElementType;
      onClick?: () => void;
    }[];
  }[];
  link?: string;
  onClick?: () => void;
};

export interface DropdownNavigationProps {
  navItems: NavItem[];
  className?: string;
}

export function DropdownNavigation({ navItems, className }: DropdownNavigationProps) {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [isHover, setIsHover] = useState<number | null>(null);

  const handleHover = (menuLabel: string | null) => {
    setOpenMenu(menuLabel);
  };

  return (
    <nav className={`relative flex items-center justify-center ${className ?? ""}`}>
      <div className="relative flex items-center justify-center">
        <ul className="relative flex items-center space-x-1">
          {navItems.map((navItem) => (
            <li
              key={navItem.label}
              className="relative"
              onMouseEnter={() => handleHover(navItem.label)}
              onMouseLeave={() => handleHover(null)}
            >
              <button
                onClick={navItem.onClick}
                className="text-sm py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground relative rounded-full"
                onMouseEnter={() => setIsHover(navItem.id)}
                onMouseLeave={() => setIsHover(null)}
              >
                <span className="font-medium">{navItem.label}</span>
                {navItem.subMenus && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 group-hover:rotate-180 duration-300 transition-transform ${
                      openMenu === navItem.label ? "rotate-180" : ""
                    }`}
                  />
                )}
                {(isHover === navItem.id || openMenu === navItem.label) && (
                  <motion.div
                    layoutId="hover-bg"
                    className="absolute inset-0 size-full bg-primary/10 -z-10"
                    style={{ borderRadius: 99 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {openMenu === navItem.label && navItem.subMenus && (
                  <div className="w-auto absolute left-0 top-full pt-2 z-50">
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-4 w-max rounded-2xl"
                    >
                      <div className="w-fit shrink-0 flex space-x-8 overflow-hidden">
                        {navItem.subMenus.map((sub) => (
                          <motion.div layout className="w-full min-w-[200px]" key={sub.title}>
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {sub.title}
                            </h3>
                            <ul className="space-y-3">
                              {sub.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <li key={item.label}>
                                    <div
                                      onClick={item.onClick}
                                      role="button"
                                      className="flex items-start space-x-3 group cursor-pointer p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                      <div className="border border-border text-foreground rounded-lg flex items-center justify-center size-8 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                        <Icon className="h-4 w-4 flex-none" />
                                      </div>
                                      <div className="leading-tight w-max">
                                        <p className="text-sm font-medium text-foreground shrink-0">
                                          {item.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground shrink-0 group-hover:text-foreground/80 transition-colors duration-300 mt-0.5">
                                          {item.description}
                                        </p>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
