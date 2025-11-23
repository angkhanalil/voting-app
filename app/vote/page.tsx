
'use client'
import { supabase } from '@/lib/supabase-client';
import { Heart, TrendingUp, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react'

export default function Vote() {
    const [votes, setVotes] = useState({ teamA: 0, teamB: 0 });
    const [isVoting, setIsVoting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [animation, setAnimation] = useState({ teamA: false, teamB: false });
    const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;

        const setupRealtime = async () => {
            // Fetch initial data จาก API
            try {
                const response = await fetch('/api/votes');
                const data: Array<{ side: string; count: number }> = await response.json();

                if (data && mounted) {
                    const votesMap = data.reduce((acc: Record<string, number>, vote: { side: string; count: number }) => {
                        acc[vote.side] = vote.count;
                        return acc;
                    }, {} as Record<string, number>);

                    setVotes({
                        teamA: votesMap.teamA || 0,
                        teamB: votesMap.teamB || 0
                    });
                }
            } catch (error) {
                console.error('Fetch initial data error:', error);
            }

            // Subscribe to Supabase Real-time (Read-only)
            const channel = supabase
                .channel('votes-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'Vote'
                    },
                    (payload: any) => {
                        if (!mounted) return;

                        console.log('Real-time update received:', payload);

                        const eventLog = `${new Date().toLocaleTimeString()}: ${payload.eventType} - ${payload.new?.side} = ${payload.new?.count}`;
                        setRealtimeEvents(prev => [eventLog, ...prev].slice(0, 5));

                        if (payload.new) {
                            setVotes(prev => ({
                                ...prev,
                                [payload.new.side]: payload.new.count
                            }));
                            setLastUpdate(new Date());
                        }
                    }
                )
                .subscribe((status: string) => {
                    console.log('Subscription status:', status);
                    if (mounted) {
                        setIsConnected(status === 'SUBSCRIBED');
                    }
                });

            return () => {
                mounted = false;
                channel.unsubscribe();
            };
        };

        const cleanup = setupRealtime();

        return () => {
            cleanup.then(cleanupFn => cleanupFn && cleanupFn());
        };
    }, []);

    const handleVote = async (side: string) => {
        if (isVoting || !isConnected) return;

        setIsVoting(true);
        setAnimation({ ...animation, [side]: true });

        try {
            // เรียก API แทนการเรียก Supabase โดยตรง
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ side })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Vote failed');
            }

            // Real-time จะอัพเดทให้อัตโนมัติ

        } catch (error: any) {
            console.error('Vote error:', error);

            if (error.message.includes('Too many requests')) {
                alert('คุณโหวตเร็วเกินไป กรุณารอสักครู่');
            } else {
                alert('การโหวตล้มเหลว กรุณาลองใหม่');
            }
        }

        setTimeout(() => {
            setAnimation({ ...animation, [side]: false });
            setIsVoting(false);
        }, 300);
    };

    const total = votes.teamA + votes.teamB;
    const percentageA = total > 0 ? (votes.teamA / total) * 100 : 50;
    const percentageB = total > 0 ? (votes.teamB / total) * 100 : 50;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-white mb-4">
                        🔥 Battle Vote 2025
                    </h1>
                    <p className="text-xl text-purple-200">
                        เลือกฝั่งที่คุณชื่นชอบ
                    </p>
                </div>

                {/* Stats */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <Users className="mx-auto mb-2 text-purple-300" size={24} />
                            <div className="text-3xl font-bold text-white">{Math.floor(total / 2)}</div>
                            <div className="text-sm text-purple-300">ผู้เข้าร่วม</div>
                        </div>
                        <div>
                            <Zap className="mx-auto mb-2 text-purple-300" size={24} />
                            <div className="text-3xl font-bold text-white">{total}</div>
                            <div className="text-sm text-purple-300">โหวตทั้งหมด</div>
                        </div>
                        <div>
                            <TrendingUp className="mx-auto mb-2 text-purple-300" size={24} />
                            <div className="text-3xl font-bold text-white">
                                {votes.teamA > votes.teamB ? 'Team A' : votes.teamB > votes.teamA ? 'Team B' : 'เสมอ'}
                            </div>
                            <div className="text-sm text-purple-300">กำลังนำ</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex items-center gap-4">
                        <span className="text-white font-medium w-16 text-right">
                            {percentageA.toFixed(1)}%
                        </span>
                        <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden relative">
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${percentageA}%` }}
                            />
                            <div
                                className="absolute right-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                style={{ width: `${percentageB}%` }}
                            />
                        </div>
                        <span className="text-white font-medium w-16">
                            {percentageB.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Vote Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    <button
                        onClick={() => handleVote('teamA')}
                        disabled={isVoting}
                        className="h-64 rounded-3xl overflow-hidden transition-transform hover:scale-105 disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)'
                        }}
                    >
                        <div className="h-full flex flex-col items-center justify-center text-white">
                            <Heart size={64} />
                            <h2 className="text-3xl font-bold mt-6 mb-2">สกายชอบก่อน</h2>
                            <div className="text-6xl font-black">{votes.teamA}</div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleVote('teamB')}
                        disabled={isVoting}
                        className="h-64 rounded-3xl overflow-hidden transition-transform hover:scale-105 disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                        }}
                    >
                        <div className="h-full flex flex-col items-center justify-center text-white">
                            <Zap size={64} />
                            <h2 className="text-3xl font-bold mt-6 mb-2">นานิชอบก่อน</h2>
                            <div className="text-6xl font-black">{votes.teamB}</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
} 