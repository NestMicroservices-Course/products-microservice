import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService){}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto
    });
    return product;
  }

  async findAll(paginationDto: PaginationDto) {

    const { page, limit } = paginationDto;
    const totalPages = await this.prisma.product.count({ where: {
      available: true
    }});
    const lastPage = Math.ceil( totalPages / limit );

    const products = await this.prisma.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        available: true
      }
    });

    return {
      data: products,
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage
      }
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
        available: true
      }
    });

    if(!product){
      throw new NotFoundException('Product with id not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: _, ...data } = updateProductDto;

    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id: id },
      data: data,
    })

    return product;
  }

  async remove(id: number) {

    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id: id },
      data: {
        available: false
      }
    })

    return product;

    // return this.prisma.product.delete({
    //   where: { id: id }
    // })
  }
}
