import React from "react";
import { Link } from "react-router-dom";

const Breadcrumb = ({ items }) => {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb bg-light rounded mb-4 p-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return isLast ? (
            <li
              key={index}
              className="breadcrumb-item active"
              aria-current="page"
            >
              {item.label}
            </li>
          ) : (
            <li key={index} className="breadcrumb-item">
              <Link to={item.link}>{item.label}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
