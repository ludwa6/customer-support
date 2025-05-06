import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FAQ } from "@/types";

const FAQSection = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: faqs, isLoading } = useQuery<FAQ[]>({
    queryKey: ['/api/faqs', selectedCategory !== "all" ? selectedCategory : undefined],
    queryFn: async ({ queryKey }) => {
      const categoryId = queryKey[1];
      const endpoint = categoryId ? `/api/faqs?categoryId=${categoryId}` : '/api/faqs';
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  return (
    <div id="faq" className="mt-12 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">Frequently Asked Questions</h2>
          <p className="text-gray-500">Find answers to common questions about SerenityFlow</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {!isCategoriesLoading && categories?.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-md p-4">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : faqs && faqs.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-left font-medium hover:bg-gray-50">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-gray-50 text-gray-700">
                <div className="mb-2 text-xs text-gray-500 font-medium">{faq.categoryName}</div>
                <p className="whitespace-pre-wrap">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No FAQs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No FAQs available in this category. Try selecting a different category.
          </p>
        </div>
      )}
    </div>
  );
};

export default FAQSection;