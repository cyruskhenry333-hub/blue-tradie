import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, FileText, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface DashboardData {
  todaysJobs: number;
  weeklyIncome: number;
  outstandingAmount: number;
  monthlyStats: {
    totalIncome: number;
    totalExpenses: number;
    jobsCompleted: number;
    outstandingAmount: number;
  };
}

interface GlobalBusinessMetricsProps {
  compact?: boolean;
  className?: string;
}

export default function GlobalBusinessMetrics({ compact = false, className = "" }: GlobalBusinessMetricsProps) {
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const metrics = [
    {
      title: "Today's Jobs",
      value: dashboardData?.todaysJobs || 0,
      icon: FileText,
      color: "text-tradie-blue",
      bgColor: "bg-tradie-blue/10",
      href: "/jobs",
      description: "View all jobs",
    },
    {
      title: "This Week",
      value: `$${(dashboardData?.weeklyIncome || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-tradie-success",
      bgColor: "bg-tradie-success/10",
      href: "/invoices",
      description: "View invoices",
    },
    {
      title: "Outstanding",
      value: `$${(dashboardData?.outstandingAmount || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-tradie-warning",
      bgColor: "bg-tradie-warning/10",
      href: "/invoices",
      description: "Manage payments",
    },
    {
      title: "Jobs This Month",
      value: dashboardData?.monthlyStats?.jobsCompleted || 0,
      icon: MessageSquare,
      color: "text-tradie-blue",
      bgColor: "bg-tradie-blue/10",
      href: "/jobs",
      description: "View job history",
    },
  ];

  if (compact) {
    return (
      <div className={`bg-slate-800 py-2 px-4 ${className}`}>
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-sm text-gray-200">
            <span className="font-semibold text-blue-300">${dashboardData?.weeklyIncome || 0}</span> this week • 
            <span className="font-semibold text-blue-300 ml-2">{dashboardData?.todaysJobs || 0}</span> jobs today • 
            <span className="font-semibold text-yellow-300 ml-2">${dashboardData?.outstandingAmount || 0}</span> outstanding
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Link key={index} href={metric.href}>
          <Card className="card-tradie hover:shadow-md transition-all cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600">{metric.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}