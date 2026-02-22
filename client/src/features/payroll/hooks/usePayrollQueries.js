import { useQuery } from '@tanstack/react-query';
import { payrollService } from '../services/payrollService';

export const payrollKeys = {
  all: ['payroll'],
  komponen: () => [...payrollKeys.all, 'komponen'],
  komponenList: (params) => [...payrollKeys.komponen(), 'list', params],
  komponenDetail: (id) => [...payrollKeys.komponen(), 'detail', id],

  tunjangan: () => [...payrollKeys.all, 'tunjangan'],
  tunjanganList: (params) => [...payrollKeys.tunjangan(), 'list', params],

  gaji: () => [...payrollKeys.all, 'gaji'],
  gajiDetail: (userId) => [...payrollKeys.gaji(), 'detail', userId],
  gajiRiwayat: (userId, params) => [...payrollKeys.gaji(), 'riwayat', userId, params],

  slip: () => [...payrollKeys.all, 'slip'],
  slipList: (params) => [...payrollKeys.slip(), 'list', params],
  slipMe: (params) => [...payrollKeys.slip(), 'me', params],
  slipDetail: (id) => [...payrollKeys.slip(), 'detail', id],
};

export const useKomponenGaji = (params) => {
  return useQuery({
    queryKey: payrollKeys.komponenList(params),
    queryFn: () => payrollService.getKomponen(params),
  });
};

export const useKomponenGajiDetail = (id) => {
  return useQuery({
    queryKey: payrollKeys.komponenDetail(id),
    queryFn: () => payrollService.getKomponenDetail(id),
    enabled: !!id,
  });
};

export const useTunjanganList = (params) => {
  return useQuery({
    queryKey: payrollKeys.tunjanganList(params),
    queryFn: () => payrollService.getTunjangan(params),
  });
};

export const useGajiPegawai = (userId) => {
  return useQuery({
    queryKey: payrollKeys.gajiDetail(userId),
    queryFn: () => payrollService.getGajiKaryawan(userId),
    enabled: !!userId,
  });
};

export const useRiwayatGaji = (userId, params) => {
  return useQuery({
    queryKey: payrollKeys.gajiRiwayat(userId, params),
    queryFn: () => payrollService.getRiwayatGaji(userId, params),
    enabled: !!userId,
  });
};

export const useSlipList = (params) => {
  return useQuery({
    queryKey: payrollKeys.slipList(params),
    queryFn: () => payrollService.getSlip(params),
  });
};

export const useSlipMe = (params) => {
  return useQuery({
    queryKey: payrollKeys.slipMe(params),
    queryFn: () => payrollService.getSlipMe(params),
  });
};

export const useSlipDetail = (id) => {
  return useQuery({
    queryKey: payrollKeys.slipDetail(id),
    queryFn: () => payrollService.getSlipDetail(id),
    enabled: !!id,
  });
};
